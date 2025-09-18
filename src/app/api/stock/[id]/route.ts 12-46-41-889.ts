import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";

export async function GET(
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

    // Obtener el item de stock específico
    const stockItem = await stockService.getStockById(id);

    if (!stockItem) {
      return NextResponse.json(
        { error: "Item de stock no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(stockItem);
  } catch (error) {
    console.error("Error fetching stock item:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
