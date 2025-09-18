import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/services/stock.service";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user.service";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener distributorId del usuario
    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No distributor found for user" },
        { status: 404 },
      );
    }

    // Obtener query de búsqueda
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // 'all', 'low', 'expiring'
    const threshold = parseInt(searchParams.get("threshold") || "10");
    const days = parseInt(searchParams.get("days") || "30");

    if (!query || query.trim() === "") {
      // Si no hay query, devolver según el tipo
      let stockItems;

      switch (type) {
        case "low":
          stockItems = await stockService.getLowStockByDistributor(
            distributorId,
            threshold,
          );
          break;
        case "expiring":
          stockItems = await stockService.getExpiringStockByDistributor(
            distributorId,
            days,
          );
          break;
        default:
          stockItems =
            await stockService.getAllStockByDistributor(distributorId);
          break;
      }

      // Transformar datos para el frontend
      const transformedItems = stockItems.map((item) => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        description: item.product.description,
        price: Number(item.product.price),
        discountedPrice: item.product.discountedPrice
          ? Number(item.product.discountedPrice)
          : undefined,
        stock: item.stock,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate.toISOString(),
        isActive: item.product.isActive,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        items: transformedItems,
        total: transformedItems.length,
      });
    }

    // Realizar búsqueda
    const stockItems = await stockService.searchStock(
      distributorId,
      query.trim(),
    );

    // Filtrar por tipo si es necesario
    let filteredItems = stockItems;

    if (type === "low") {
      filteredItems = stockItems.filter((item) => item.stock <= threshold);
    } else if (type === "expiring") {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      filteredItems = stockItems.filter(
        (item) => new Date(item.expirationDate) <= futureDate && item.stock > 0,
      );
    }

    // Transformar datos para el frontend
    const transformedItems = filteredItems.map((item) => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      description: item.product.description,
      price: Number(item.product.price),
      discountedPrice: item.product.discountedPrice
        ? Number(item.product.discountedPrice)
        : undefined,
      stock: item.stock,
      lotNumber: item.lotNumber,
      expirationDate: item.expirationDate.toISOString(),
      isActive: item.product.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items: transformedItems,
      total: transformedItems.length,
      query: query.trim(),
    });
  } catch (error) {
    console.error("Error searching stock:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
