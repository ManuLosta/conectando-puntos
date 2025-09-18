import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/services/order.service";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user.service";
import { OrderStatus } from "@/repositories/order.repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el distribuidor del usuario
    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No se encontró distribuidor para el usuario" },
        { status: 403 },
      );
    }

    // Obtener parámetros de consulta opcionales
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Obtener pedidos
    let orders;
    if (status) {
      // Validar que el status sea válido
      const validStatuses: OrderStatus[] = [
        "PENDING",
        "CONFIRMED",
        "IN_PREPARATION",
        "DELIVERED",
        "CANCELLED",
      ];

      if (validStatuses.includes(status as OrderStatus)) {
        orders = await orderService.getOrdersByDistributorAndStatus(
          distributorId,
          status as OrderStatus,
        );
      } else {
        return NextResponse.json(
          {
            error: `Estado inválido. Estados válidos: ${validStatuses.join(", ")}`,
          },
          { status: 400 },
        );
      }
    } else {
      orders = await orderService.getAllOrdersByDistributor(distributorId);
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el distribuidor del usuario
    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No se encontró distribuidor para el usuario" },
        { status: 403 },
      );
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { clientId, salespersonId, items, deliveryAddress, notes } = body;

    // Validar datos requeridos
    if (
      !clientId ||
      !salespersonId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Datos requeridos: clientId, salespersonId, items (array no vacío)",
        },
        { status: 400 },
      );
    }

    // Crear el pedido
    const newOrder = await orderService.createOrderForSalesperson(
      salespersonId,
      distributorId,
      clientId,
      items,
      deliveryAddress,
      notes,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Pedido creado exitosamente",
        order: newOrder,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        error: "Error al crear el pedido",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
