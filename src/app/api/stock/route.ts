import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stockService } from "@/services/stock.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interfaz para crear un nuevo producto
interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  price: number;
  discountedPrice?: number;
  discount?: number;
}

// Interfaz para crear un item de inventario
interface CreateInventoryItemData {
  productId: string;
  distributorId: string;
  stock: number;
  lotNumber: string;
  expirationDate: string;
}

// Nueva interfaz para crear producto con stock inicial
interface CreateProductWithStockData {
  name: string;
  description?: string;
  sku: string;
  price: number;
  discountedPrice?: number;
  discount?: number;
  distributorId: string;
  initialStock: number;
  lotNumber: string;
  expirationDate: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributorId");
    const type = searchParams.get("type");
    const threshold = searchParams.get("threshold");
    const daysFromNow = searchParams.get("daysFromNow");

    if (!distributorId) {
      return NextResponse.json(
        { error: "distributorId is required" },
        { status: 400 },
      );
    }

    let stockData;

    switch (type) {
      case "low":
        const thresholdNum = threshold ? parseInt(threshold) : 10;
        stockData = await stockService.getLowStockByDistributor(
          distributorId,
          thresholdNum,
        );
        break;
      case "expiring":
        const daysNum = daysFromNow ? parseInt(daysFromNow) : 30;
        stockData = await stockService.getExpiringStockByDistributor(
          distributorId,
          daysNum,
        );
        break;
      default:
        stockData = await stockService.getAllStockByDistributor(distributorId);
    }

    return NextResponse.json({ stock: stockData });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create_product_with_stock": {
        const {
          name,
          description,
          sku,
          price,
          discountedPrice,
          discount,
          distributorId,
          initialStock,
          lotNumber,
          expirationDate,
        }: CreateProductWithStockData = body;

        // Validar datos requeridos
        if (
          !name ||
          !sku ||
          !price ||
          !distributorId ||
          !lotNumber ||
          !expirationDate
        ) {
          return NextResponse.json(
            {
              error:
                "name, sku, price, distributorId, lotNumber, and expirationDate are required",
            },
            { status: 400 },
          );
        }

        if (price <= 0) {
          return NextResponse.json(
            { error: "price must be greater than 0" },
            { status: 400 },
          );
        }

        if (initialStock < 0) {
          return NextResponse.json(
            { error: "initialStock cannot be negative" },
            { status: 400 },
          );
        }

        if (discount !== undefined && (discount < 0 || discount > 99.99)) {
          return NextResponse.json(
            { error: "discount must be between 0 and 99.99" },
            { status: 400 },
          );
        }

        // Validar fecha de vencimiento
        const expDate = new Date(expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expDate <= today) {
          return NextResponse.json(
            { error: "expirationDate must be in the future" },
            { status: 400 },
          );
        }

        try {
          const productWithStock = await stockService.createProductWithStock({
            name,
            description,
            sku,
            price,
            discountedPrice,
            discount,
            distributorId,
            initialStock,
            lotNumber,
            expirationDate: expDate,
          });

          return NextResponse.json({
            success: true,
            productWithStock,
          });
        } catch (serviceError) {
          console.error("Service error:", serviceError);
          return NextResponse.json(
            {
              error:
                serviceError instanceof Error
                  ? serviceError.message
                  : "Error creating product with stock",
            },
            { status: 400 },
          );
        }
      }

      case "create_product": {
        const {
          name,
          description,
          sku,
          price,
          discountedPrice,
          discount,
        }: CreateProductData = body;

        // Validar datos requeridos
        if (!name || !sku || !price) {
          return NextResponse.json(
            { error: "name, sku, and price are required" },
            { status: 400 },
          );
        }

        // Verificar si el SKU ya existe
        const existingProduct = await prisma.product.findUnique({
          where: { sku },
        });

        if (existingProduct) {
          return NextResponse.json(
            { error: "Product with this SKU already exists" },
            { status: 400 },
          );
        }

        // Crear el producto
        const newProduct = await prisma.product.create({
          data: {
            name,
            description,
            sku,
            price,
            discountedPrice,
            discount,
            isActive: true,
          },
        });

        return NextResponse.json({ product: newProduct });
      }

      case "create_inventory_item": {
        const {
          productId,
          distributorId,
          stock,
          lotNumber,
          expirationDate,
        }: CreateInventoryItemData = body;

        // Validar datos requeridos
        if (!productId || !distributorId || !lotNumber || !expirationDate) {
          return NextResponse.json(
            {
              error:
                "productId, distributorId, lotNumber, and expirationDate are required",
            },
            { status: 400 },
          );
        }

        // Validar que el producto existe
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        // Validar que la distribuidora existe
        const distributor = await prisma.user.findUnique({
          where: {
            id: distributorId,
            role: "DISTRIBUTOR",
          },
        });

        if (!distributor) {
          return NextResponse.json(
            { error: "Distributor not found" },
            { status: 404 },
          );
        }

        // Crear el item de inventario
        const newInventoryItem = await prisma.inventoryItem.create({
          data: {
            productId,
            distributorId,
            stock: stock || 0,
            lotNumber,
            expirationDate: new Date(expirationDate),
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                sku: true,
                price: true,
                discountedPrice: true,
                discount: true,
                isActive: true,
              },
            },
          },
        });

        return NextResponse.json({ inventoryItem: newInventoryItem });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in stock POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inventoryItemId, ...updateData } = body;

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "inventoryItemId is required" },
        { status: 400 },
      );
    }

    // Convertir fecha si está presente
    if (updateData.expirationDate) {
      updateData.expirationDate = new Date(updateData.expirationDate);
    }

    const updatedStock = await stockService.updateStock(
      inventoryItemId,
      updateData,
    );

    return NextResponse.json({ stock: updatedStock });
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
