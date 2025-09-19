import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { inventoryItemId, type, quantity, reason } = body;

    // Validaciones básicas
    if (!inventoryItemId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 },
      );
    }

    if (quantity <= 0 && type !== "ADJUSTMENT") {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 },
      );
    }

    // Crear el movimiento de stock
    await stockService.createStockMovement(inventoryItemId, {
      type,
      quantity,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Movimiento de stock creado exitosamente",
    });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener el distributorId del usuario
    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No distributor found for user" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validar parámetros
    if (limit > 100) {
      return NextResponse.json(
        { error: "Limit cannot exceed 100" },
        { status: 400 },
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "Offset cannot be negative" },
        { status: 400 },
      );
    }

    const result = await stockService.getAllStockMovementsByDistributor(
      distributorId,
      limit,
      offset,
    );

    return NextResponse.json({
      movements: result.movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        newStock: movement.newStock,
        reason: movement.reason,
        createdAt: movement.createdAt.toISOString(),
        product: movement.product,
        lotNumber: movement.lotNumber,
        order: movement.order,
      })),
      total: result.total,
      hasMore: result.hasMore,
      pagination: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
