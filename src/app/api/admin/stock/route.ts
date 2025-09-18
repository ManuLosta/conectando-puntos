import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stockService } from "@/services/stock.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es admin
    const userRole = session.user.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Solo administradores pueden acceder." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributorId");

    if (!distributorId) {
      return NextResponse.json(
        { error: "distributorId es requerido" },
        { status: 400 },
      );
    }

    // Obtener todos los productos del distributor con su inventario
    const products =
      await stockService.getInventoryByDistributor(distributorId);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error obteniendo stock:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Acceso denegado. Solo administradores pueden crear productos.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      price,
      distributorId,
      initialStock,
      lotNumber,
      expirationDate,
    } = body;

    // Validaciones básicas
    if (
      !name ||
      !sku ||
      !price ||
      !distributorId ||
      !lotNumber ||
      !expirationDate
    ) {
      return NextResponse.json(
        {
          error:
            "Campos requeridos faltantes: name, sku, price, distributorId, lotNumber, expirationDate",
        },
        { status: 400 },
      );
    }

    // Verificar que el distribuidor existe
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
    });

    if (!distributor) {
      return NextResponse.json(
        { error: "Distribuidor no encontrado" },
        { status: 404 },
      );
    }

    // Crear producto y entrada de inventario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Verificar que el SKU no existe para este distribuidor
      const existingProduct = await tx.product.findUnique({
        where: {
          sku_distributorId: {
            sku: sku,
            distributorId: distributorId,
          },
        },
      });

      if (existingProduct) {
        throw new Error(
          `Ya existe un producto con SKU ${sku} para este distribuidor`,
        );
      }

      // Crear el producto
      const product = await tx.product.create({
        data: {
          name,
          description: description || null,
          sku,
          price: parseFloat(price),
          distributorId,
          isActive: true,
        },
      });

      // Crear entrada de inventario si se especificó stock inicial
      let inventoryItem = null;
      if (initialStock && parseInt(initialStock) > 0) {
        inventoryItem = await tx.inventoryItem.create({
          data: {
            productId: product.id,
            distributorId,
            stock: parseInt(initialStock),
            lotNumber,
            expirationDate: new Date(expirationDate),
          },
        });

        // Registrar movimiento de stock inicial
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: "INBOUND",
            quantity: parseInt(initialStock),
            previousStock: 0,
            newStock: parseInt(initialStock),
            reason: "Stock inicial",
          },
        });
      }

      return { product, inventoryItem };
    });

    return NextResponse.json(
      {
        message: "Producto creado exitosamente",
        product: result.product,
        inventoryItem: result.inventoryItem,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando producto:", error);

    if (
      error instanceof Error &&
      error.message.includes("Ya existe un producto")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Acceso denegado. Solo administradores pueden actualizar productos.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      productId,
      name,
      description,
      price,
      isActive,
      inventoryItemId,
      stock,
      lotNumber,
      expirationDate,
      reason,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId es requerido" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Actualizar producto si se proporcionaron datos
      let updatedProduct = null;
      if (
        name ||
        description !== undefined ||
        price ||
        isActive !== undefined
      ) {
        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price) updateData.price = parseFloat(price);
        if (isActive !== undefined) updateData.isActive = isActive;

        updatedProduct = await tx.product.update({
          where: { id: productId },
          data: updateData,
        });
      }

      // Actualizar inventario si se proporcionaron datos
      let updatedInventoryItem = null;
      if (
        inventoryItemId &&
        (stock !== undefined || lotNumber || expirationDate)
      ) {
        const currentInventory = await tx.inventoryItem.findUnique({
          where: { id: inventoryItemId },
        });

        if (!currentInventory) {
          throw new Error("Item de inventario no encontrado");
        }

        const updateInventoryData: Record<string, unknown> = {};
        if (lotNumber) updateInventoryData.lotNumber = lotNumber;
        if (expirationDate)
          updateInventoryData.expirationDate = new Date(expirationDate);

        // Si se actualiza el stock, registrar el movimiento
        if (stock !== undefined) {
          const newStock = parseInt(stock);
          const previousStock = currentInventory.stock;
          const difference = newStock - previousStock;

          updateInventoryData.stock = newStock;

          // Registrar movimiento de stock
          if (difference !== 0) {
            await tx.stockMovement.create({
              data: {
                inventoryItemId: inventoryItemId,
                type: "ADJUSTMENT",
                quantity: Math.abs(difference),
                previousStock: previousStock,
                newStock: newStock,
                reason: reason || "Ajuste manual por admin",
              },
            });
          }
        }

        updatedInventoryItem = await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: updateInventoryData,
        });
      }

      return { updatedProduct, updatedInventoryItem };
    });

    return NextResponse.json({
      message: "Producto actualizado exitosamente",
      product: result.updatedProduct,
      inventoryItem: result.updatedInventoryItem,
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
