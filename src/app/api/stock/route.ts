import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No se encontró distribuidora para el usuario" },
        { status: 404 },
      );
    }

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    // Si hay búsqueda, usar el método de búsqueda, sino obtener todos
    let stockItems;
    if (query.trim()) {
      stockItems = await stockService.searchStockByDistributor(
        distributorId,
        query,
      );
    } else {
      stockItems = await stockService.getAllStockByDistributor(distributorId);
    }

    return NextResponse.json(stockItems);
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
