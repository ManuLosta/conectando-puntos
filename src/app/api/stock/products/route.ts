import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributorId");

    if (!distributorId) {
      return NextResponse.json(
        { error: "distributorId es requerido" },
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

    // Obtener todos los productos activos del distribuidor
    const products = await prisma.product.findMany({
      where: {
        distributorId: distributorId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        price: true,
        discountedPrice: true,
      },
      orderBy: [{ name: "asc" }],
    });

    // Formatear los precios para el frontend
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: Number(product.price),
      discountedPrice: product.discountedPrice
        ? Number(product.discountedPrice)
        : undefined,
    }));

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
