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
  await prisma.clientDistributor.deleteMany();
  await prisma.salesperson.deleteMany();
  await prisma.distributorAdmin.deleteMany();
  await prisma.superAdmin.deleteMany();
  await prisma.finalClient.deleteMany();
  await prisma.distributor.deleteMany();
  await prisma.user.deleteMany();

  // Create distributors
  console.log("🏢 Creating distributors...");
  const distributor1 = await prisma.distributor.create({
    data: {
      name: "Distribuidora Central",
      address: "Av. Corrientes 1234",
      city: "Buenos Aires",
      phone: "+54 11 4567-8901",
      email: "contacto@distribuidoracentral.com",
    },
  });

  const distributor2 = await prisma.distributor.create({
    data: {
      name: "Lácteos del Sur",
      address: "Calle San Martín 567",
      city: "Rosario",
      phone: "+54 341 456-7890",
      email: "ventas@lacteosdelsur.com",
    },
  });

  // Create super admin
  console.log("👑 Creating super admin...");
  const superAdminUser = await prisma.user.create({
    data: {
      email: "admin@sistema.com",
      name: "Administrador del Sistema",
      phone: "+54 11 1234-5678",
      role: "SUPER_ADMIN",
    },
  });

  await prisma.superAdmin.create({
    data: {
      userId: superAdminUser.id,
      permissions: ["ALL"],
    },
  });

  // Create distributor admins
  console.log("🏢 Creating distributor admins...");
  const admin1User = await prisma.user.create({
    data: {
      email: "admin@distribuidoracentral.com",
      name: "Carlos Pérez",
      phone: "+54 11 2345-6789",
      role: "DISTRIBUTOR_ADMIN",
    },
  });

  await prisma.distributorAdmin.create({
    data: {
      userId: admin1User.id,
      distributorId: distributor1.id,
    },
  });

  const admin2User = await prisma.user.create({
    data: {
      email: "admin@lacteosdelsur.com",
      name: "Ana García",
      phone: "+54 341 234-5678",
      role: "DISTRIBUTOR_ADMIN",
    },
  });

  await prisma.distributorAdmin.create({
    data: {
      userId: admin2User.id,
      distributorId: distributor2.id,
    },
  });

  // Create salespeople
  console.log("🤵 Creating salespeople...");
  const salesperson1User = await prisma.user.create({
    data: {
      email: "vendedor1@distribuidoracentral.com",
      name: "Roberto López",
      phone: "+54 11 3456-7890",
      role: "SALESPERSON",
    },
  });

  const salesperson1 = await prisma.salesperson.create({
    data: {
      userId: salesperson1User.id,
      distributorId: distributor1.id,
      territory: "Zona Norte",
    },
  });

  const salesperson2User = await prisma.user.create({
    data: {
      email: "vendedor2@distribuidoracentral.com",
      name: "María Fernández",
      phone: "+54 11 4567-8901",
      role: "SALESPERSON",
    },
  });

  const salesperson2 = await prisma.salesperson.create({
    data: {
      userId: salesperson2User.id,
      distributorId: distributor1.id,
      territory: "Zona Sur",
    },
  });

  const salesperson3User = await prisma.user.create({
    data: {
      email: "vendedor1@lacteosdelsur.com",
      name: "Juan Martínez",
      phone: "+54 341 345-6789",
      role: "SALESPERSON",
    },
  });

  const salesperson3 = await prisma.salesperson.create({
    data: {
      userId: salesperson3User.id,
      distributorId: distributor2.id,
      territory: "Centro",
    },
  });

  console.log("✅ Created salespersons:", {
    salesperson1: salesperson1.id,
    salesperson2: salesperson2.id,
    salesperson3: salesperson3.id,
  });

  // Create final clients
  console.log("👥 Creating final clients...");
  const clientsData = [
    {
      name: "Supermercado Don Pepe",
      email: "compras@donpepe.com",
      address: "Av. Belgrano 456",
      city: "Buenos Aires",
    },
    {
      name: "Almacén La Esquina",
      email: "pedidos@laesquina.com",
      address: "Rivadavia 789",
      city: "Buenos Aires",
    },
    {
      name: "MaxiKiosco Centro",
      email: "ventas@maxikiosco.com",
      address: "Córdoba 123",
      city: "Buenos Aires",
    },
    {
      name: "Mercadito del Barrio",
      email: "info@mercadito.com",
      address: "San Juan 456",
      city: "Rosario",
    },
    {
      name: "Almacén San José",
      email: "contacto@sanjose.com",
      address: "Mitre 789",
      city: "Rosario",
    },
  ];

  const clients = [];
  for (const clientData of clientsData) {
    const clientUser = await prisma.user.create({
      data: {
        email: clientData.email,
        name: clientData.name,
        role: "FINAL_CLIENT",
      },
    });

    const client = await prisma.finalClient.create({
      data: {
        userId: clientUser.id,
        address: clientData.address,
        city: clientData.city,
      },
    });

    clients.push(client);
  }

  // Associate clients with distributors
  console.log("🔗 Creating client-distributor relationships...");
  // Clients 1-3 with distributor 1
  for (let i = 0; i < 3; i++) {
    await prisma.clientDistributor.create({
      data: {
        distributorId: distributor1.id,
        clientId: clients[i].id,
        discount: Math.floor(Math.random() * 15), // 0-15% discount
        creditLimit: Math.floor(Math.random() * 100000) + 50000, // 50k-150k credit limit
        paymentTerms: ["contado", "30 días", "15 días"][
          Math.floor(Math.random() * 3)
        ],
      },
    });
  }

  // Clients 4-5 with distributor 2
  for (let i = 3; i < 5; i++) {
    await prisma.clientDistributor.create({
      data: {
        distributorId: distributor2.id,
        clientId: clients[i].id,
        discount: Math.floor(Math.random() * 15),
        creditLimit: Math.floor(Math.random() * 100000) + 50000,
        paymentTerms: ["contado", "30 días", "15 días"][
          Math.floor(Math.random() * 3)
        ],
      },
    });
  }

  // Read and create products from CSV
  console.log("📦 Creating products from CSV...");
  const stockData = await readStockCSV();
  const products: { product: Product; originalData: StockCSVItem }[] = [];

  for (const item of stockData) {
    const price = await generatePrice(item.descripcion);

    const product = await prisma.product.create({
      data: {
        name: item.descripcion,
        sku: `SKU-${item.codigo.padStart(4, "0")}`,
        price: price,
        isActive: !item.anulado,
        description: `Producto ${item.descripcion.toLowerCase()}`,
      },
    });

    products.push({ product, originalData: item });
  }

  console.log(`✅ Created ${products.length} products`);

  // Create inventory items for distributor 1
  console.log("📊 Creating inventory for Distribuidora Central...");
  for (const { product, originalData } of products) {
    const stock = Math.max(0, originalData.cantidad); // Ensure positive stock

    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        distributorId: distributor1.id,
        stock: stock,
        minStock: Math.floor(stock * 0.2), // 20% of current stock as minimum
        maxStock: Math.floor(stock * 2), // Double current stock as maximum
      },
    });
  }

  // Create inventory items for distributor 2 (with different stock levels)
  console.log("📊 Creating inventory for Lácteos del Sur...");
  for (const { product, originalData } of products.slice(
    0,
    Math.floor(products.length * 0.7),
  )) {
    const baseStock = Math.max(0, originalData.cantidad);
    const stock = Math.floor(baseStock * (0.5 + Math.random())); // 50-150% of distributor 1's stock

    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        distributorId: distributor2.id,
        stock: stock,
        minStock: Math.floor(stock * 0.2),
        maxStock: Math.floor(stock * 2),
      },
    });
  }

  // Create some sample orders
  console.log("📋 Creating sample orders...");
  const sampleOrders = [
    {
      salespersonId: salesperson1.id,
      clientId: clients[0].id,
      items: [
        { productIndex: 0, quantity: 2 },
        { productIndex: 1, quantity: 3 },
        { productIndex: 2, quantity: 1 },
      ],
      status: "CONFIRMED",
    },
    {
      salespersonId: salesperson2.id,
      clientId: clients[1].id,
      items: [
        { productIndex: 3, quantity: 1 },
        { productIndex: 4, quantity: 2 },
      ],
      status: "PENDING",
    },
  ];

  for (const orderData of sampleOrders) {
    const total = orderData.items.reduce((sum, item) => {
      const product = products[item.productIndex].product;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        salespersonId: orderData.salespersonId,
        clientId: orderData.clientId,
        total: total,
        status: orderData.status as
          | "PENDING"
          | "CONFIRMED"
          | "IN_PREPARATION"
          | "IN_TRANSIT"
          | "DELIVERED"
          | "CANCELLED",
        deliveryAddress: "Dirección de entrega de ejemplo",
        notes: "Orden de ejemplo generada por seed",
      },
    });

    // Create order items
    for (const item of orderData.items) {
      const product = products[item.productIndex].product;
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          subtotal: Number(product.price) * item.quantity,
        },
      });
    }
  }

  console.log("🎉 Database seed completed successfully!");

  // Print summary
  console.log("\n📊 SEED SUMMARY:");
  console.log(`• Distributors: 2`);
  console.log(`• Users: ${await prisma.user.count()}`);
  console.log(`• Products: ${await prisma.product.count()}`);
  console.log(`• Inventory Items: ${await prisma.inventoryItem.count()}`);
  console.log(`• Final Clients: ${await prisma.finalClient.count()}`);
  console.log(`• Orders: ${await prisma.order.count()}`);

  console.log("\n🔑 TEST USERS:");
  console.log("Super Admin: admin@sistema.com");
  console.log("Distributor 1 Admin: admin@distribuidoracentral.com");
  console.log("Distributor 2 Admin: admin@lacteosdelsur.com");
  console.log("Salesperson 1: vendedor1@distribuidoracentral.com");
  console.log("Salesperson 2: vendedor2@distribuidoracentral.com");
  console.log("Salesperson 3: vendedor1@lacteosdelsur.com");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
