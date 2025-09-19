import { NextRequest, NextResponse } from "next/server";
import {
  orderRepo,
  OrderStatus,
  OrderWithItems,
} from "@/repositories/order.repository";
import { prisma } from "@/lib/prisma";
import { PaymentType, CollectionStatus } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { status } = await request.json();
    const { id } = await params;

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
    const updatedOrder = await orderRepo.updateOrderStatus(
      id,
      status as OrderStatus,
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 },
      );
    }

    // Si el pedido se confirma, crear automáticamente la factura y colección inicial
    if (status === "CONFIRMED") {
      await createInvoiceAndCollection(updatedOrder);
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

async function createInvoiceAndCollection(order: OrderWithItems) {
  try {
    // Usar el total que ya está calculado en el pedido
    const totalAmount = parseFloat(order.total.toString());

    // Crear la factura
    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        distributorId: order.distributorId,
        clientId: order.clientId,
        subtotal: totalAmount,
        taxAmount: 0, // Por ahora sin impuestos
        total: totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde hoy
        status: "PENDING",
        invoiceNumber: `INV-${order.orderNumber || order.id.slice(-6)}-${Date.now().toString().slice(-6)}`,
        notes: "Factura creada automáticamente al confirmar el pedido",
      },
    });

    // Crear la colección inicial (sin pagos aún)
    await prisma.collection.create({
      data: {
        invoiceId: invoice.id,
        distributorId: order.distributorId,
        collectionNumber: `COL-${invoice.invoiceNumber.replace("INV-", "")}`,
        amountDue: totalAmount,
        amountPaid: 0, // Inicialmente sin pagos
        collectionDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde hoy
        paymentType: PaymentType.CASH, // Tipo por defecto
        status: CollectionStatus.PENDING,
        notes: "Colección creada automáticamente al confirmar el pedido",
      },
    });

    console.log(`Invoice and collection created for order ${order.id}`);
  } catch (error) {
    console.error("Error creating invoice and collection:", error);
    throw error;
  }
}
