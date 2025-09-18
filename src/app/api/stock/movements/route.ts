import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
