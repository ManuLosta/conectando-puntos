import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CreateStockMovementData {
  inventoryItemId: string;
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER";
  quantity: number;
  reason: string;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateStockMovementData = await request.json();
    const { inventoryItemId, type, quantity, reason, orderId } = body;

    // Validaciones básicas
    if (!inventoryItemId || !type || !quantity || !reason) {
      return NextResponse.json(
        { error: "inventoryItemId, type, quantity y reason son requeridos" },
        { status: 400 },
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (!["INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de movimiento no válido" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Obtener el item de inventario actual
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              distributorId: true,
            },
          },
        },
      });

      if (!inventoryItem) {
        throw new Error("Item de inventario no encontrado");
      }

      const previousStock = inventoryItem.stock;
      let newStock: number;

      // Calcular el nuevo stock según el tipo de movimiento
      switch (type) {
        case "INBOUND":
          newStock = previousStock + quantity;
          break;
        case "OUTBOUND":
          newStock = Math.max(0, previousStock - quantity);
          if (quantity > previousStock) {
            throw new Error(
              `No se puede reducir ${quantity} unidades. Stock disponible: ${previousStock}`,
            );
          }
          break;
        case "ADJUSTMENT":
          // Para ajustes, la cantidad representa el nuevo stock total
          newStock = quantity;
          break;
        case "TRANSFER":
          newStock = Math.max(0, previousStock - quantity);
          if (quantity > previousStock) {
            throw new Error(
              `No se puede transferir ${quantity} unidades. Stock disponible: ${previousStock}`,
            );
          }
          break;
        default:
          throw new Error("Tipo de movimiento no válido");
      }

      // Actualizar el stock del item de inventario
      const updatedInventoryItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { stock: newStock },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              description: true,
              price: true,
              discountedPrice: true,
              isActive: true,
            },
          },
        },
      });

      // Crear el registro de movimiento de stock
      const stockMovement = await tx.stockMovement.create({
        data: {
          inventoryItemId: inventoryItemId,
          type: type,
          quantity: quantity,
          previousStock: previousStock,
          newStock: newStock,
          reason: reason.trim(),
          orderId: orderId || null,
        },
      });

      return {
        inventoryItem: updatedInventoryItem,
        stockMovement: stockMovement,
      };
    });

    return NextResponse.json({
      message: "Movimiento de stock registrado exitosamente",
      inventoryItem: {
        id: result.inventoryItem.id,
        productId: result.inventoryItem.productId,
        distributorId: result.inventoryItem.distributorId,
        stock: result.inventoryItem.stock,
        lotNumber: result.inventoryItem.lotNumber,
        expirationDate: result.inventoryItem.expirationDate.toISOString(),
        product: {
          id: result.inventoryItem.product.id,
          name: result.inventoryItem.product.name,
          sku: result.inventoryItem.product.sku,
          description: result.inventoryItem.product.description,
          price: Number(result.inventoryItem.product.price),
          discountedPrice: result.inventoryItem.product.discountedPrice
            ? Number(result.inventoryItem.product.discountedPrice)
            : undefined,
          isActive: result.inventoryItem.product.isActive,
        },
      },
      stockMovement: {
        id: result.stockMovement.id,
        type: result.stockMovement.type,
        quantity: result.stockMovement.quantity,
        previousStock: result.stockMovement.previousStock,
        newStock: result.stockMovement.newStock,
        reason: result.stockMovement.reason,
        createdAt: result.stockMovement.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating stock movement:", error);

    // Manejar errores específicos de la transacción
    if (error instanceof Error) {
      if (
        error.message.includes("No se puede reducir") ||
        error.message.includes("No se puede transferir")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("no encontrado")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// GET para obtener historial de movimientos de un item de inventario
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inventoryItemId = searchParams.get("inventoryItemId");

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "inventoryItemId es requerido" },
        { status: 400 },
      );
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        inventoryItemId: inventoryItemId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      movements: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        newStock: movement.newStock,
        reason: movement.reason,
        createdAt: movement.createdAt.toISOString(),
        order: movement.order
          ? {
              id: movement.order.id,
              orderNumber: movement.order.orderNumber,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
