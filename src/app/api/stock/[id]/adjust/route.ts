import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { quantity, type, reason } = await request.json();

    // Validar parámetros
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (!type || !["increase", "decrease"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de ajuste inválido" },
        { status: 400 },
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "El motivo del ajuste es requerido" },
        { status: 400 },
      );
    }

    // Ajustar el stock
    await stockService.adjustStock(id, quantity, type, reason.trim());

    return NextResponse.json({
      success: true,
      message: `Stock ${type === "increase" ? "aumentado" : "reducido"} exitosamente`,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
