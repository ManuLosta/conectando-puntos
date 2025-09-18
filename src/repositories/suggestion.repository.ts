import { SuggestedProduct } from "@/types/suggestedProduct";
import { PrismaClient } from "@prisma/client";

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
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        discount: true,
        discountedPrice: true,
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
        f_discount_percentage: product.discount
          ? Number(product.discount)
          : null,
        f_discounted_price: product.discountedPrice
          ? Number(product.discountedPrice)
          : null,
        f_has_discount: !!product.discount && Number(product.discount) > 0,
      };
    });

    // 7. Sort and limit results
    suggestions.sort((a, b) => {
      // Helper function to calculate high rotation score
      const getHighRotationScore = (product: SuggestedProduct) => {
        // High rotation = many orders with many different buyers
        const ordersBuyersRatio =
          product.f_global_buyers_cnt_1y > 0
            ? product.f_global_orders_cnt_1y / product.f_global_buyers_cnt_1y
            : 0;
        return ordersBuyersRatio;
      };

      // Helper function to calculate client affinity score
      const getClientAffinityScore = (product: SuggestedProduct) => {
        let score = 0;
        // Base score from purchase history
        score += product.f_client_qty_26w * 10;
        score += product.f_client_orders_cnt_26w * 5;

        // Bonus if client bought before
        if (product.f_client_bought_before) {
          score += 20;

          // Additional bonus if it's been a while since last purchase (encourage repeat)
          if (product.f_last_buy_at) {
            const daysSinceLastBuy = Math.floor(
              (asOf.getTime() - product.f_last_buy_at.getTime()) /
                (24 * 60 * 60 * 1000),
            );
            if (daysSinceLastBuy > 30 && daysSinceLastBuy < 180) {
              score += 15; // Sweet spot for repeat purchases
            }
          }
        }
        return score;
      };

      // Helper function to calculate global popularity score
      const getGlobalPopularityScore = (product: SuggestedProduct) => {
        let score = 0;
        score += product.f_global_orders_cnt_1y * 2;
        score += product.f_global_buyers_cnt_1y * 3;
        score += product.f_global_qty_1y * 0.1;
        return score;
      };

      // Helper function to calculate price favorability (lower price = higher score)
      const getPriceFavorabilityScore = (product: SuggestedProduct) => {
        // Normalize price score (higher score for lower prices)
        // Assuming price range 0-1000, invert it
        return Math.max(0, 1000 - product.price) / 10;
      };

      // Helper function to calculate discount score
      const getDiscountScore = (product: SuggestedProduct) => {
        if (!product.f_has_discount || !product.f_discount_percentage) {
          return 0;
        }

        // Score increases with discount percentage
        // Good discounts (>10%) get significant boost for operational efficiency
        const discountPercentage = product.f_discount_percentage;
        if (discountPercentage >= 20) {
          return 100; // Excellent discount
        } else if (discountPercentage >= 15) {
          return 75; // Very good discount
        } else if (discountPercentage >= 10) {
          return 50; // Good discount
        } else if (discountPercentage >= 5) {
          return 25; // Moderate discount
        } else {
          return 10; // Small discount
        }
      };

      // Calculate scores for both products
      const scoreA = {
        expiringSoon: a.f_expiring_soon ? 1000 : 0, // Highest priority
        clientAffinity: getClientAffinityScore(a),
        globalPopularity: getGlobalPopularityScore(a),
        isNew: a.f_is_new ? 200 : 0,
        highRotation: getHighRotationScore(a) * 50,
        priceFavorability: getPriceFavorabilityScore(a),
        discount: getDiscountScore(a),
        hasStock: a.f_has_stock ? 50 : 0,
      };

      const scoreB = {
        expiringSoon: b.f_expiring_soon ? 1000 : 0,
        clientAffinity: getClientAffinityScore(b),
        globalPopularity: getGlobalPopularityScore(b),
        isNew: b.f_is_new ? 200 : 0,
        highRotation: getHighRotationScore(b) * 50,
        priceFavorability: getPriceFavorabilityScore(b),
        discount: getDiscountScore(b),
        hasStock: b.f_has_stock ? 50 : 0,
      };

      // Total weighted score
      const totalA =
        scoreA.expiringSoon +
        scoreA.clientAffinity * 3 + // Highest weight for client affinity
        scoreA.discount * 2.5 + // High weight for discounts (operational efficiency)
        scoreA.globalPopularity * 2 + // Weight for global popularity
        scoreA.isNew * 1.5 + // Weight for new products
        scoreA.highRotation * 1.2 + // Weight for high rotation
        scoreA.priceFavorability * 1 + // Weight for price
        scoreA.hasStock; // Base requirement

      const totalB =
        scoreB.expiringSoon +
        scoreB.clientAffinity * 3 +
        scoreB.discount * 2.5 + // High weight for discounts (operational efficiency)
        scoreB.globalPopularity * 2 +
        scoreB.isNew * 1.5 +
        scoreB.highRotation * 1.2 +
        scoreB.priceFavorability * 1 +
        scoreB.hasStock;

      return totalB - totalA; // Higher score first
    });

    return suggestions.slice(0, top);
  }
}

const prisma = new PrismaClient();
export const suggestionRepo = new PrismaSuggestionRepository(prisma);
