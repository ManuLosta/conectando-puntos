import { NextRequest, NextResponse } from "next/server";
import { orderRepo, OrderStatus } from "@/repositories/order.repository";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { status } = await request.json();

    // Validar que el status sea válido
    const validStatuses: OrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "IN_PREPARATION",
      "DELIVERED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Actualizar el estado del pedido
    const updatedOrder = await orderRepo.updateOrderStatus(params.id, status);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
