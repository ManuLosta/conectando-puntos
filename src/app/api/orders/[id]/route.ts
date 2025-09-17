import { NextRequest, NextResponse } from "next/server";
import { orderRepo } from "@/repositories/order.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Obtener el pedido completo con todos sus detalles
    const order = await orderRepo.findById(params.id);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
