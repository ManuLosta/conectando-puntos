import { PrismaClient, Product } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface StockCSVItem {
  codigo: string;
  descripcion: string;
  anulado: boolean;
  cantidad: number;
  codprecan?: string;
  resto?: number;
  codpreres?: string;
}

async function readStockCSV(): Promise<StockCSVItem[]> {
  const csvPath = path.join(process.cwd(), "resources", "stock.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");

  // Skip header
  const dataLines = lines.slice(1).filter((line) => line.trim());

  return dataLines
    .map((line) => {
      const [codigo, descripcion, anul, cant, codprecan, resto, codpreres] =
        line.split(";");
      return {
        codigo: codigo?.trim(),
        descripcion: descripcion?.trim(),
        anulado: anul?.trim() === "si", // "no" means active, "si" means inactive
        cantidad: parseInt(cant?.trim()) || 0,
        codprecan: codprecan?.trim() || "",
        resto: parseInt(resto?.trim()) || 0,
        codpreres: codpreres?.trim() || "",
      };
    })
    .filter((item) => item.codigo && item.descripcion);
}

async function generatePrice(productName: string): Promise<number> {
  const name = productName.toLowerCase();

  // Different price ranges based on product type
  if (name.includes("queso")) {
    if (name.includes("kg") || name.includes("kilo")) {
      return Math.floor(Math.random() * 3000) + 2000; // 2000-5000 for cheese per kg
    }
    return Math.floor(Math.random() * 800) + 400; // 400-1200 for packaged cheese
  }

  if (name.includes("crema")) {
    return Math.floor(Math.random() * 600) + 300; // 300-900 for cream
  }

  if (name.includes("yogur") || name.includes("yog")) {
    return Math.floor(Math.random() * 400) + 200; // 200-600 for yogurt
  }

  if (name.includes("arroz con leche")) {
    return Math.floor(Math.random() * 500) + 250; // 250-750 for rice pudding
  }

  // Default price range
  return Math.floor(Math.random() * 1000) + 300;
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.salesperson.deleteMany();
  await prisma.userTenant.deleteMany();
  await prisma.distributor.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create one distributor
  console.log("🏢 Creating distributor...");
  const distributor = await prisma.distributor.create({
    data: {
      name: "Distribuidora Central",
      address: "Av. Corrientes 1234",
      city: "Buenos Aires",
      email: "contacto@distribuidoracentral.com",
    },
  });

  // Create distributor admin
  console.log("🧪 Creating distributor admin...");
  const adminUser = await prisma.user.create({
    data: {
      id: "admin-user-1",
      email: "admin@distribuidoracentral.com",
      name: "Carlos Pérez",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  await prisma.userTenant.create({
    data: {
      userId: adminUser.id,
      distributorId: distributor.id,
      role: "DISTRIBUTOR_ADMIN",
    },
  });

  console.log("🔐 Creating Better Auth account...");
  await prisma.account.create({
    data: {
      id: "admin-account-1",
      accountId: "admin@distribuidoracentral.com",
      providerId: "credential",
      userId: adminUser.id,
      password:
        "63bcb208ba848992e9101a08255017ab:3f63cd58f33234960984319678fb8927041cad25e19675193a2bc72b5f8b5480ffaf051bdf1cb13f6d03c4af35903a22fff6a327df42a7d1b28789791bf615e5",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Read and create products from CSV
  console.log("📦 Creating products from CSV...");
  const stockData = await readStockCSV();
  const products: Product[] = [];

  // Create products for the distributor
  for (const item of stockData) {
    const price = await generatePrice(item.descripcion);

    const product = await prisma.product.create({
      data: {
        name: item.descripcion,
        sku: `SKU-${item.codigo.padStart(4, "0")}`,
        price: price,
        distributorId: distributor.id,
        isActive: !item.anulado,
        description: `Producto ${item.descripcion.toLowerCase()}`,
      },
    });

    products.push(product);
  }

  console.log(`✅ Created ${products.length} products`);

  // Create inventory items for all products
  console.log("📊 Creating inventory items...");
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const originalData = stockData[i];
    const stock = Math.max(0, originalData.cantidad); // Ensure positive stock

    // Generate lot number and expiration date
    const lotNumber = `LOT-${product.sku}-${Date.now()}`;
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + Math.floor(Math.random() * 365) + 30,
    ); // 30-395 days from now

    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        stock: stock,
        lotNumber: lotNumber,
        expirationDate: expirationDate,
        distributorId: product.distributorId,
      },
    });
  }

  console.log("🎉 Database seed completed successfully!");

  // Print summary
  console.log("\n📊 SEED SUMMARY:");
  console.log(`• Distributors: 1`);
  console.log(`• Users: ${await prisma.user.count()}`);
  console.log(`• Products: ${await prisma.product.count()}`);
  console.log(`• Inventory Items: ${await prisma.inventoryItem.count()}`);

  console.log("\n🔑 TEST USER:");
  console.log("Admin: admin@distribuidoracentral.com (password: password)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
