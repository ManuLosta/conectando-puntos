import { NextRequest, NextResponse } from "next/server";
import { stockMovementService } from "@/services/stock-movement.service";
import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { StockMovementType } from "@prisma/client";

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
        { error: "No se encontró distribuidor para el usuario" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as StockMovementType | null;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    let movements;

    if (type) {
      movements = await stockMovementService.getMovementsByType(
        distributorId,
        type,
      );
    } else if (limit) {
      movements = await stockMovementService.getRecentMovements(
        distributorId,
        limit,
      );
    } else {
      movements =
        await stockMovementService.getAllMovementsByDistributor(distributorId);
    }

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
