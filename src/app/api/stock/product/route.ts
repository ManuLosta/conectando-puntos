import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { stockService } from "@/services/stock.service";

const prisma = new PrismaClient();

interface UpdateProductData {
  productId: string;
  name?: string;
  description?: string | null;
  sku?: string;
  price?: number;
  discount?: number | null;
  discountedPrice?: number | null;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateProductData = await request.json();
    const {
      productId,
      name,
      description,
      sku,
      price,
      discount,
      discountedPrice,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId es requerido" },
        { status: 400 },
      );
    }

    // Verificar que el producto existe y obtener su información actual
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        distributor: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    // Validaciones
    if (name && !name.trim()) {
      return NextResponse.json(
        { error: "El nombre no puede estar vacío" },
        { status: 400 },
      );
    }

    if (sku && !sku.trim()) {
      return NextResponse.json(
        { error: "El SKU no puede estar vacío" },
        { status: 400 },
      );
    }

    if (price !== undefined && price <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (
      discount !== undefined &&
      discount !== null &&
      (discount < 0 || discount >= 100)
    ) {
      return NextResponse.json(
        { error: "El descuento debe estar entre 0 y 99.99%" },
        { status: 400 },
      );
    }

    // Si se está cambiando el SKU, verificar que no exista otro producto con el mismo SKU
    if (sku && sku !== existingProduct.sku) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          sku: sku,
          distributorId: existingProduct.distributorId,
          id: {
            not: productId,
          },
        },
      });

      if (duplicateProduct) {
        return NextResponse.json(
          { error: "Ya existe otro producto con este SKU" },
          { status: 409 },
        );
      }
    }

    // Construir los datos a actualizar
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (sku !== undefined) updateData.sku = sku.trim();
    if (price !== undefined) updateData.price = price;
    if (discount !== undefined) updateData.discount = discount;
    if (discountedPrice !== undefined)
      updateData.discountedPrice = discountedPrice;

    // Actualizar el producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        distributor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Producto actualizado exitosamente",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        sku: updatedProduct.sku,
        price: Number(updatedProduct.price),
        discount: updatedProduct.discount
          ? Number(updatedProduct.discount)
          : null,
        discountedPrice: updatedProduct.discountedPrice
          ? Number(updatedProduct.discountedPrice)
          : null,
        isActive: updatedProduct.isActive,
        distributor: updatedProduct.distributor,
        updatedAt: updatedProduct.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId es requerido" },
        { status: 400 },
      );
    }

    // Verificar que el producto existe y obtener la distribuidora
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        distributorId: true,
        isActive: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    if (!existingProduct.isActive) {
      return NextResponse.json(
        { error: "El producto ya está eliminado" },
        { status: 400 },
      );
    }

    // Eliminar el producto usando el servicio
    await stockService.deleteProduct(productId, existingProduct.distributorId);

    return NextResponse.json({
      message: "Producto eliminado exitosamente",
      productId: productId,
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
