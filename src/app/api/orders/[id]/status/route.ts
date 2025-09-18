import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/services/order.service";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user.service";
import { OrderStatus } from "@/repositories/order.repository";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos del request
    const body = await request.json();
    const { status } = body;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del pedido requerido" },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json({ error: "Estado requerido" }, { status: 400 });
    }

    // Validar que el status sea válido
    const validStatuses: OrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "IN_PREPARATION",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        {
          error: `Estado inválido. Estados válidos: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Verificar que el usuario tenga acceso al distribuidor del pedido
    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No se encontró distribuidor para el usuario" },
        { status: 403 },
      );
    }

    // Verificar que el pedido existe y pertenece al distribuidor
    const existingOrder = await orderService.getOrderById(id);

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 },
      );
    }

    if (existingOrder.distributorId !== distributorId) {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar este pedido" },
        { status: 403 },
      );
    }

    // Actualizar el estado del pedido
    const updatedOrder = await orderService.updateOrderStatus(
      id,
      status as OrderStatus,
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Error al actualizar el pedido" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pedido actualizado a estado ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
