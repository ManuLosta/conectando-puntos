import { SuggestedProduct } from "@/types/suggestedProduct";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface SuggestionRepository {
  getSuggestedProducts(
    clientId: string,
    distributorId: string,
    asOf: Date,
    top: number,
  ): Promise<SuggestedProduct[]>;
}

export class PrismaSuggestionRepository implements SuggestionRepository {
  constructor(private prisma: PrismaClient) {}

  async getSuggestedProducts(
    clientId: string,
    distributorId: string,
    asOf: Date,
    top: number,
  ): Promise<SuggestedProduct[]> {
    // Define time boundaries
    const lookbackClientDays = 182; // 26 weeks
    const lookbackGlobalDays = 365; // 1 year
    const newDays = 90;
    const avoidRepeatDays = 14;
    const minExpiryDays = 30;
    const topGlobalLimit = 30;
    const topNewLimit = 30;

    const sinceClient = new Date(
      asOf.getTime() - lookbackClientDays * 24 * 60 * 60 * 1000,
    );
    const sinceGlobal = new Date(
      asOf.getTime() - lookbackGlobalDays * 24 * 60 * 60 * 1000,
    );
    const sinceNew = new Date(asOf.getTime() - newDays * 24 * 60 * 60 * 1000);
    const sinceAvoid = new Date(
      asOf.getTime() - avoidRepeatDays * 24 * 60 * 60 * 1000,
    );

    // 1. Get client purchase history
    const clientOrders = await this.prisma.order.findMany({
      where: {
        clientId,
        distributorId,
        status: {
          in: ["CONFIRMED", "IN_PREPARATION", "IN_TRANSIT", "DELIVERED"],
        },
        paymentStatus: { not: "REJECTED" },
        createdAt: { gte: sinceClient, lte: asOf },
      },
      include: {
        items: true,
      },
    });

    // Process client history
    const clientItemStats = new Map<
      string,
      { orders: number; qty: number; lastBuyAt: Date }
    >();
    clientOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = clientItemStats.get(item.productId) || {
          orders: 0,
          qty: 0,
          lastBuyAt: new Date(0),
        };
        current.orders += 1;
        current.qty += item.quantity;
        if (order.createdAt > current.lastBuyAt) {
          current.lastBuyAt = order.createdAt;
        }
        clientItemStats.set(item.productId, current);
      });
    });

    // 2. Get global statistics
    const globalOrders = await this.prisma.order.findMany({
      where: {
        distributorId,
        status: {
          in: ["CONFIRMED", "IN_PREPARATION", "IN_TRANSIT", "DELIVERED"],
        },
        paymentStatus: { not: "REJECTED" },
        createdAt: { gte: sinceGlobal, lte: asOf },
      },
      include: {
        items: true,
      },
    });

    const globalStats = new Map<
      string,
      { orders: Set<string>; buyers: Set<string>; qty: number }
    >();
    globalOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = globalStats.get(item.productId) || {
          orders: new Set(),
          buyers: new Set(),
          qty: 0,
        };
        current.orders.add(order.id);
        if (order.clientId) current.buyers.add(order.clientId);
        current.qty += item.quantity;
        globalStats.set(item.productId, current);
      });
    });

    // 3. Get stock information
    const stockInfo = await this.prisma.inventoryItem.groupBy({
      by: ["productId"],
      _sum: { stock: true },
      _min: { expirationDate: true },
      where: {
        stock: { gt: 0 },
      },
    });

    const stockMap = new Map<
      string,
      { total: number; minDaysToExpiry: number | null }
    >();
    stockInfo.forEach((item) => {
      const daysToExpiry = item._min.expirationDate
        ? Math.ceil(
            (item._min.expirationDate.getTime() - asOf.getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : null;
      stockMap.set(item.productId, {
        total: item._sum.stock || 0,
        minDaysToExpiry: daysToExpiry,
      });
    });

    // 4. Get new products
    const newProducts = await this.prisma.product.findMany({
      where: {
        distributorId,
        isActive: true,
        createdAt: { gte: sinceNew, lte: asOf },
      },
      select: { id: true },
      take: topNewLimit,
    });
    const newProductIds = new Set(newProducts.map((p) => p.id));

    // 5. Build candidate sets
    const candidateIds = new Set<string>();

    // History bucket (avoid recent purchases)
    clientItemStats.forEach((stats, productId) => {
      if (stats.lastBuyAt < sinceAvoid) {
        candidateIds.add(productId);
      }
    });

    // Global bucket (top performing products)
    const globalSorted = Array.from(globalStats.entries())
      .sort((a, b) => b[1].orders.size - a[1].orders.size)
      .slice(0, topGlobalLimit);
    globalSorted.forEach(([productId]) => candidateIds.add(productId));

    // New products bucket
    newProducts.forEach((p) => candidateIds.add(p.id));

    // 6. Get final product details and build suggestions
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: Array.from(candidateIds) },
        distributorId,
        isActive: true,
      },
    });

    const suggestions: SuggestedProduct[] = products.map((product) => {
      const clientStats = clientItemStats.get(product.id);
      const globalStat = globalStats.get(product.id);
      const stock = stockMap.get(product.id);
      const isNew = newProductIds.has(product.id);

      return {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        price: Number(product.price),
        f_client_orders_cnt_26w: clientStats?.orders || 0,
        f_client_qty_26w: clientStats?.qty || 0,
        f_last_buy_at: clientStats?.lastBuyAt || null,
        f_client_bought_before: !!clientStats,
        f_global_orders_cnt_1y: globalStat?.orders.size || 0,
        f_global_buyers_cnt_1y: globalStat?.buyers.size || 0,
        f_global_qty_1y: globalStat?.qty || 0,
        f_is_new: isNew,
        f_stock_total: stock?.total || 0,
        f_min_days_to_expiry: stock?.minDaysToExpiry || null,
        f_has_stock: (stock?.total || 0) > 0,
        f_expiring_soon:
          stock?.minDaysToExpiry !== null &&
          stock?.minDaysToExpiry !== undefined &&
          stock.minDaysToExpiry < minExpiryDays,
      };
    });

    // 7. Sort and limit results
    suggestions.sort((a, b) => {
      // New products first
      if (a.f_is_new && !b.f_is_new) return -1;
      if (!a.f_is_new && b.f_is_new) return 1;

      // Then by global popularity
      if (a.f_global_orders_cnt_1y !== b.f_global_orders_cnt_1y) {
        return b.f_global_orders_cnt_1y - a.f_global_orders_cnt_1y;
      }

      // Finally by client purchase history
      return b.f_client_qty_26w - a.f_client_qty_26w;
    });

    return suggestions.slice(0, top);
  }
}

export const suggestionRepo = new PrismaSuggestionRepository(prisma);
