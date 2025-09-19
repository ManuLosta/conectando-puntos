import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AddExistingStockData {
  productId: string;
  distributorId: string;
  initialStock: number;
  lotNumber: string;
  expirationDate: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AddExistingStockData = await request.json();
    const {
      productId,
      distributorId,
      initialStock,
      lotNumber,
      expirationDate,
    } = body;

    // Validaciones básicas
    if (!productId || !distributorId || !lotNumber || !expirationDate) {
      return NextResponse.json(
        {
          error:
            "productId, distributorId, lotNumber y expirationDate son requeridos",
        },
        { status: 400 },
      );
    }

    if (initialStock < 0) {
      return NextResponse.json(
        { error: "El stock inicial no puede ser negativo" },
        { status: 400 },
      );
    }

    // Validar fecha de vencimiento
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expDate <= today) {
      return NextResponse.json(
        { error: "La fecha de vencimiento debe ser futura" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verificar que el producto existe y pertenece al distribuidor
      const product = await tx.product.findFirst({
        where: {
          id: productId,
          distributorId: distributorId,
          isActive: true,
        },
      });

      if (!product) {
        throw new Error(
          "Producto no encontrado o no pertenece al distribuidor especificado",
        );
      }

      // Verificar que el distribuidor existe
      const distributor = await tx.distributor.findUnique({
        where: { id: distributorId },
      });

      if (!distributor) {
        throw new Error("Distribuidor no encontrado");
      }

      // Verificar que no existe ya un item de inventario con el mismo número de lote para este producto
      const existingInventoryItem = await tx.inventoryItem.findFirst({
        where: {
          productId: productId,
          lotNumber: lotNumber,
          distributorId: distributorId,
        },
      });

      if (existingInventoryItem) {
        throw new Error(
          `Ya existe un lote con el número ${lotNumber} para este producto`,
        );
      }

      // Crear el nuevo item de inventario
      const inventoryItem = await tx.inventoryItem.create({
        data: {
          productId: productId,
          distributorId: distributorId,
          stock: initialStock,
          lotNumber: lotNumber,
          expirationDate: expDate,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              description: true,
              price: true,
              discountedPrice: true,
              isActive: true,
            },
          },
        },
      });

      // Si hay stock inicial, crear un movimiento de entrada
      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: "INBOUND",
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            reason: "Stock inicial del lote",
          },
        });
      }

      return inventoryItem;
    });

    return NextResponse.json(
      {
        message: "Stock agregado exitosamente",
        inventoryItem: {
          id: result.id,
          productId: result.productId,
          distributorId: result.distributorId,
          stock: result.stock,
          lotNumber: result.lotNumber,
          expirationDate: result.expirationDate.toISOString(),
          createdAt: result.createdAt.toISOString(),
          product: {
            id: result.product.id,
            name: result.product.name,
            sku: result.product.sku,
            description: result.product.description,
            price: Number(result.product.price),
            discountedPrice: result.product.discountedPrice
              ? Number(result.product.discountedPrice)
              : undefined,
            isActive: result.product.isActive,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding stock to existing product:", error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes("Ya existe un lote")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("no encontrado")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
