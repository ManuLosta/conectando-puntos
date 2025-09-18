import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user.service";

export async function POST(request: NextRequest) {
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

    const {
      productName,
      sku,
      price,
      description,
      stock,
      lotNumber,
      expirationDate,
    } = await request.json();

    // Validar parámetros
    if (!productName?.trim()) {
      return NextResponse.json(
        { error: "El nombre del producto es requerido" },
        { status: 400 },
      );
    }

    if (!sku?.trim()) {
      return NextResponse.json(
        { error: "El SKU es requerido" },
        { status: 400 },
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (stock === undefined || stock < 0) {
      return NextResponse.json(
        { error: "El stock debe ser 0 o mayor" },
        { status: 400 },
      );
    }

    if (!lotNumber?.trim()) {
      return NextResponse.json(
        { error: "El número de lote es requerido" },
        { status: 400 },
      );
    }

    if (!expirationDate) {
      return NextResponse.json(
        { error: "La fecha de vencimiento es requerida" },
        { status: 400 },
      );
    }

    // Crear el nuevo producto y item de inventario
    const newStock = await stockService.addNewStock(distributorId, {
      productName: productName.trim(),
      sku: sku.trim().toUpperCase(),
      price: parseFloat(price),
      description: description?.trim() || null,
      stock: parseInt(stock),
      lotNumber: lotNumber.trim(),
      expirationDate: new Date(expirationDate),
    });

    return NextResponse.json({
      success: true,
      message: "Stock agregado exitosamente",
      data: newStock,
    });
  } catch (error) {
    console.error("Error adding new stock:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
