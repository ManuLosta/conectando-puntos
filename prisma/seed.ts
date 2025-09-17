import {
  PrismaClient,
  Product,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";
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

// Generate order notes helper function
function generateOrderNotes(clientName: string, itemsCount: number): string {
  const notes = [
    `Pedido regular de ${clientName}`,
    `Entrega urgente solicitada`,
    `Cliente prefiere entrega temprana`,
    `Revisar stock antes de confirmar`,
    `Pedido especial con ${itemsCount} productos`,
    `Entrega coordinada con cliente`,
    `Verificar calidad de productos lácteos`,
    `Cliente solicita factura tipo A`,
    `Entrega en horario comercial únicamente`,
    `Pedido recurrente mensual`,
  ];
  return notes[Math.floor(Math.random() * notes.length)];
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
  await prisma.userTenant.deleteMany();
  await prisma.finalClient.deleteMany();
  await prisma.distributor.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
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
      id: "admin-user-1",
      email: "admin@sistema.com",
      name: "Administrador del Sistema",
      emailVerified: true,
      role: "SUPER_ADMIN",
    },
  });

  // Create test admin account for development
  console.log("🧪 Creating test admin account...");
  const testAdminUser = await prisma.user.create({
    data: {
      id: "test-admin-1",
      email: "test@conectandopuntos.com",
      name: "Admin de Prueba",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  // Add test admin to distributor 1 as admin
  await prisma.userTenant.create({
    data: {
      userId: testAdminUser.id,
      distributorId: distributor1.id,
      role: "DISTRIBUTOR_ADMIN",
    },
  });

  console.log("🔐 Creating Better Auth account...");
  await prisma.account.create({
    data: {
      id: "test-account-1",
      accountId: "test@conectandopuntos.com",
      providerId: "credential",
      userId: testAdminUser.id,
      password:
        "63bcb208ba848992e9101a08255017ab:3f63cd58f33234960984319678fb8927041cad25e19675193a2bc72b5f8b5480ffaf051bdf1cb13f6d03c4af35903a22fff6a327df42a7d1b28789791bf615e5",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create distributor admins
  console.log("🏢 Creating distributor admins...");
  const admin1User = await prisma.user.create({
    data: {
      id: "admin-user-2",
      email: "admin@distribuidoracentral.com",
      name: "Carlos Pérez",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  await prisma.userTenant.create({
    data: {
      userId: admin1User.id,
      distributorId: distributor1.id,
      role: "DISTRIBUTOR_ADMIN",
    },
  });

  const admin2User = await prisma.user.create({
    data: {
      id: "admin-user-3",
      email: "admin@lacteosdelsur.com",
      name: "Ana García",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  await prisma.userTenant.create({
    data: {
      userId: admin2User.id,
      distributorId: distributor2.id,
      role: "DISTRIBUTOR_ADMIN",
    },
  });

  // Create salespeople
  console.log("🤵 Creating salespeople...");
  const salesperson1User = await prisma.user.create({
    data: {
      id: "salesperson-user-1",
      email: "vendedor1@distribuidoracentral.com",
      name: "Roberto López",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  await prisma.userTenant.create({
    data: {
      userId: salesperson1User.id,
      distributorId: distributor1.id,
      role: "MEMBER",
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
      id: "salesperson-user-2",
      email: "vendedor2@distribuidoracentral.com",
      name: "María Fernández",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  await prisma.userTenant.create({
    data: {
      userId: salesperson2User.id,
      distributorId: distributor1.id,
      role: "MEMBER",
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
      id: "salesperson-user-3",
      email: "vendedor1@lacteosdelsur.com",
      name: "Juan Martínez",
      emailVerified: true,
      role: "TENANT_USER",
    },
  });

  await prisma.userTenant.create({
    data: {
      userId: salesperson3User.id,
      distributorId: distributor2.id,
      role: "MEMBER",
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
  for (let i = 0; i < clientsData.length; i++) {
    const clientData = clientsData[i];
    const clientUser = await prisma.user.create({
      data: {
        id: `client-user-${i + 1}`,
        email: clientData.email,
        name: clientData.name,
        emailVerified: true,
        role: "TENANT_USER",
      },
    });

    const client = await prisma.finalClient.create({
      data: {
        userId: clientUser.id,
        name: clientData.name,
        address: clientData.address,
        city: clientData.city,
        phone: `+54 11 ${(1111 + i).toString().padStart(4, "0")}-${(1111 + i).toString().padStart(4, "0")}`,
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
  for (const { product, originalData } of products) {
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

  // Create realistic orders with historical data
  console.log("📋 Creating realistic historical orders...");

  // Generate orders for the last 6 months
  const ordersToCreate = 150; // Generate 150 orders
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 months ago

  console.log(
    `📊 Generating ${ordersToCreate} orders from ${startDate.toLocaleDateString()} to ${new Date().toLocaleDateString()}`,
  );

  for (let i = 0; i < ordersToCreate; i++) {
    // Random date between start date and now
    const randomDate = new Date(
      startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()),
    );

    // Select random distributor and get its products and clients
    const isDistributor1 = Math.random() > 0.4; // 60% distributor1, 40% distributor2
    const selectedDistributor = isDistributor1 ? distributor1 : distributor2;
    const distributorProducts = products.filter(
      (p) => p.distributorId === selectedDistributor.id,
    );
    const distributorClients = isDistributor1
      ? clients.slice(0, 3)
      : clients.slice(3, 5);
    const distributorSalespeople = isDistributor1
      ? [salesperson1, salesperson2]
      : [salesperson3];

    if (distributorProducts.length === 0 || distributorClients.length === 0)
      continue;

    // Random client and salesperson
    const selectedClient =
      distributorClients[Math.floor(Math.random() * distributorClients.length)];
    const selectedSalesperson =
      distributorSalespeople[
        Math.floor(Math.random() * distributorSalespeople.length)
      ];

    // Generate order items (1-8 products per order)
    const numItems = Math.floor(Math.random() * 8) + 1;
    const orderItems: { productId: string; quantity: number; price: number }[] =
      [];
    const usedProducts = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      let selectedProduct;
      let attempts = 0;

      // Try to select a unique product for this order
      do {
        selectedProduct =
          distributorProducts[
            Math.floor(Math.random() * distributorProducts.length)
          ];
        attempts++;
      } while (usedProducts.has(selectedProduct.product.id) && attempts < 10);

      if (usedProducts.has(selectedProduct.product.id)) continue;

      usedProducts.add(selectedProduct.product.id);

      // Generate realistic quantities based on product type
      let quantity = 1;
      const productName = selectedProduct.product.name.toLowerCase();

      if (productName.includes("queso")) {
        if (productName.includes("kg") || productName.includes("kilo")) {
          quantity = Math.floor(Math.random() * 5) + 1; // 1-5 kg
        } else {
          quantity = Math.floor(Math.random() * 12) + 2; // 2-13 units
        }
      } else if (productName.includes("yogur") || productName.includes("yog")) {
        quantity = Math.floor(Math.random() * 24) + 6; // 6-29 units (high volume)
      } else if (productName.includes("crema")) {
        quantity = Math.floor(Math.random() * 8) + 2; // 2-9 units
      } else {
        quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units default
      }

      orderItems.push({
        productId: selectedProduct.product.id,
        quantity: quantity,
        price: Number(selectedProduct.product.price),
      });
    }

    if (orderItems.length === 0) continue;

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Realistic status distribution based on order age
    const daysSinceOrder = Math.floor(
      (Date.now() - randomDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    let status: OrderStatus;
    let paymentStatus: PaymentStatus;

    if (daysSinceOrder > 30) {
      // Old orders are mostly delivered or cancelled
      status =
        Math.random() > 0.1 ? OrderStatus.DELIVERED : OrderStatus.CANCELLED;
      paymentStatus =
        status === OrderStatus.DELIVERED
          ? Math.random() > 0.2
            ? PaymentStatus.PAID
            : PaymentStatus.PARTIAL
          : PaymentStatus.REJECTED;
    } else if (daysSinceOrder > 7) {
      // Recent orders have mixed status
      const rand = Math.random();
      if (rand > 0.7) status = OrderStatus.DELIVERED;
      else if (rand > 0.5) status = OrderStatus.IN_TRANSIT;
      else if (rand > 0.3) status = OrderStatus.IN_PREPARATION;
      else if (rand > 0.1) status = OrderStatus.CONFIRMED;
      else status = OrderStatus.CANCELLED;

      paymentStatus =
        status === OrderStatus.DELIVERED
          ? PaymentStatus.PAID
          : status === OrderStatus.CANCELLED
            ? PaymentStatus.REJECTED
            : Math.random() > 0.6
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING;
    } else {
      // Very recent orders are mostly pending or confirmed
      status =
        Math.random() > 0.3 ? OrderStatus.PENDING : OrderStatus.CONFIRMED;
      paymentStatus = PaymentStatus.PENDING;
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${randomDate.getFullYear()}${String(randomDate.getMonth() + 1).padStart(2, "0")}${String(randomDate.getDate()).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`,
        salespersonId: selectedSalesperson.id,
        clientId: selectedClient.id,
        distributorId: selectedDistributor.id,
        total: total,
        status: status,
        paymentStatus: paymentStatus,
        deliveryAddress: selectedClient.address,
        deliveryDate:
          status === OrderStatus.DELIVERED
            ? new Date(
                randomDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
              )
            : null,
        notes: generateOrderNotes(selectedClient.name, orderItems.length),
        createdAt: randomDate,
        updatedAt:
          status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED
            ? new Date(
                randomDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000,
              )
            : randomDate,
      },
    });

    // Create order items
    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        },
      });
    }

    // Log progress every 25 orders
    if ((i + 1) % 25 === 0) {
      console.log(`  ✅ Created ${i + 1}/${ordersToCreate} orders...`);
    }
  }

  console.log("✅ Historical orders creation completed!");

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
  console.log(
    "Super Admin: admin@sistema.com (manages all tenants, not part of any tenant)",
  );
  console.log(
    "Test Admin: test@conectandopuntos.com (password: password) - Admin of Distributor 1",
  );
  console.log("Distributor 1 Admin: admin@distribuidoracentral.com");
  console.log("Distributor 2 Admin: admin@lacteosdelsur.com");
  console.log("Salesperson 1: vendedor1@distribuidoracentral.com (Zona Norte)");
  console.log("Salesperson 2: vendedor2@distribuidoracentral.com (Zona Sur)");
  console.log("Salesperson 3: vendedor1@lacteosdelsur.com (Centro)");

  console.log("\n📞 TEST CONTACTS:");
  console.log("Salesperson 1: 541133837591 (Zona Norte)");
  console.log("Salesperson 2: +54 11 4567-8901 (Zona Sur)");
  console.log("Salesperson 3: +54 341 345-6789 (Centro)");
  console.log("Client 1: +54 11 1111-1111 (Supermercado Don Pepe)");
  console.log("Client 2: +54 11 1112-1112 (Almacén La Esquina)");
  console.log("Client 3: +54 11 1113-1113 (MaxiKiosco Centro)");
  console.log("Client 4: +54 11 1114-1114 (Mercadito del Barrio)");
  console.log("Client 5: +54 11 1115-1115 (Almacén San José)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
