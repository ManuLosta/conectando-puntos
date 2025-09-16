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
      email: "contacto@distribuidoracentral.com",
    },
  });

  const distributor2 = await prisma.distributor.create({
    data: {
      name: "Lácteos del Sur",
      address: "Calle San Martín 567",
      city: "Rosario",
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
      phone: "+54 11 2345-5678",
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
      role: "DISTRIBUTOR_ADMIN", // Using existing role
    },
  });

  const salesperson1 = await prisma.salesperson.create({
    data: {
      userId: salesperson1User.id,
      distributorId: distributor1.id,
      territory: "Zona Norte",
      phone: "541133837591",
    },
  });

  const salesperson2User = await prisma.user.create({
    data: {
      email: "vendedor2@distribuidoracentral.com",
      name: "María Fernández",
      phone: "+54 11 4567-8901",
      role: "DISTRIBUTOR_ADMIN", // Using existing role
    },
  });

  const salesperson2 = await prisma.salesperson.create({
    data: {
      userId: salesperson2User.id,
      distributorId: distributor1.id,
      territory: "Zona Sur",
      phone: "+54 11 4567-8901",
    },
  });

  const salesperson3User = await prisma.user.create({
    data: {
      email: "vendedor1@lacteosdelsur.com",
      name: "Juan Martínez",
      phone: "+54 341 345-6789",
      role: "DISTRIBUTOR_ADMIN", // Using existing role
    },
  });

  const salesperson3 = await prisma.salesperson.create({
    data: {
      userId: salesperson3User.id,
      distributorId: distributor2.id,
      territory: "Centro",
      phone: "+54 341 345-6789",
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
      phone: "+54 11 1111-1111",
    },
    {
      name: "Almacén La Esquina",
      email: "pedidos@laesquina.com",
      address: "Rivadavia 789",
      city: "Buenos Aires",
      phone: "+54 11 2222-2222",
    },
    {
      name: "MaxiKiosco Centro",
      email: "ventas@maxikiosco.com",
      address: "Córdoba 123",
      city: "Buenos Aires",
      phone: "+54 11 3333-3333",
    },
    {
      name: "Mercadito del Barrio",
      email: "info@mercadito.com",
      address: "San Juan 456",
      city: "Rosario",
      phone: "+54 341 111-1111",
    },
    {
      name: "Almacén San José",
      email: "contacto@sanjose.com",
      address: "Mitre 789",
      city: "Rosario",
      phone: "+54 341 222-2222",
    },
  ];

  const clients = [];
  for (const clientData of clientsData) {
    const clientUser = await prisma.user.create({
      data: {
        email: clientData.email,
        name: clientData.name,
        phone: clientData.phone,
        role: "DISTRIBUTOR_ADMIN", // Using existing role
      },
    });

    const client = await prisma.finalClient.create({
      data: {
        userId: clientUser.id,
        name: clientData.name,
        address: clientData.address,
        city: clientData.city,
        phone: clientData.phone,
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

  // Read and create products from CSV for each distributor
  console.log("📦 Creating products from CSV...");
  const stockData = await readStockCSV();
  const products: {
    product: Product;
    originalData: StockCSVItem;
    distributorId: string;
  }[] = [];

  // Create products for distributor 1
  for (const item of stockData) {
    const price = await generatePrice(item.descripcion);

    const product = await prisma.product.create({
      data: {
        name: item.descripcion,
        sku: `SKU-${item.codigo.padStart(4, "0")}`,
        price: price,
        distributorId: distributor1.id,
        isActive: !item.anulado,
        description: `Producto ${item.descripcion.toLowerCase()}`,
      },
    });

    products.push({
      product,
      originalData: item,
      distributorId: distributor1.id,
    });
  }

  // Create products for distributor 2 (subset of products)
  for (const item of stockData.slice(0, Math.floor(stockData.length * 0.7))) {
    const price = await generatePrice(item.descripcion);

    const product = await prisma.product.create({
      data: {
        name: item.descripcion,
        sku: `SKU-${item.codigo.padStart(4, "0")}`,
        price: price,
        distributorId: distributor2.id,
        isActive: !item.anulado,
        description: `Producto ${item.descripcion.toLowerCase()}`,
      },
    });

    products.push({
      product,
      originalData: item,
      distributorId: distributor2.id,
    });
  }

  console.log(`✅ Created ${products.length} products`);

  // Create inventory items for all products
  console.log("📊 Creating inventory items...");
  for (const { product, originalData, distributorId } of products) {
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
      },
    });
  }

  // Create some sample orders
  console.log("📋 Creating sample orders...");
  const sampleOrders = [
    {
      salespersonId: salesperson1.id,
      clientId: clients[0].id,
      distributorId: distributor1.id,
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
      distributorId: distributor1.id,
      items: [
        { productIndex: 3, quantity: 1 },
        { productIndex: 4, quantity: 2 },
      ],
      status: "PENDING",
    },
    {
      salespersonId: salesperson3.id,
      clientId: clients[3].id,
      distributorId: distributor2.id,
      items: [
        { productIndex: 0, quantity: 1 },
        { productIndex: 1, quantity: 2 },
      ],
      status: "CONFIRMED",
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
        distributorId: orderData.distributorId,
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

  console.log("\n📞 TEST CONTACTS:");
  console.log("Salesperson 1: +54 11 3456-7890 (Zona Norte)");
  console.log("Salesperson 2: +54 11 4567-8901 (Zona Sur)");
  console.log("Salesperson 3: +54 341 345-6789 (Centro)");
  console.log("Client 1: +54 11 1111-1111 (Supermercado Don Pepe)");
  console.log("Client 2: +54 11 2222-2222 (Almacén La Esquina)");
  console.log("Client 3: +54 11 3333-3333 (MaxiKiosco Centro)");
  console.log("Client 4: +54 341 111-1111 (Mercadito del Barrio)");
  console.log("Client 5: +54 341 222-2222 (Almacén San José)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
