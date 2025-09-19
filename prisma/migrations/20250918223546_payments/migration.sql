-- CreateEnum
CREATE TYPE "public"."CollectionStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."collections" (
    "id" TEXT NOT NULL,
    "collectionNumber" TEXT NOT NULL,
    "status" "public"."CollectionStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "collectorId" TEXT,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentType" "public"."PaymentType",
    "notes" TEXT,
    "reference" TEXT,
    "receiptNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_notes" (
    "id" TEXT NOT NULL,
    "deliveryNoteNumber" TEXT NOT NULL,
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "clientId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "deliveryAddress" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "deliveryInstructions" TEXT,
    "carrierName" TEXT,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "orderId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "clientId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_collectionNumber_key" ON "public"."collections"("collectionNumber");

-- CreateIndex
CREATE INDEX "collections_distributorId_collectionDate_idx" ON "public"."collections"("distributorId", "collectionDate");

-- CreateIndex
CREATE INDEX "collections_distributorId_status_idx" ON "public"."collections"("distributorId", "status");

-- CreateIndex
CREATE INDEX "collections_invoiceId_idx" ON "public"."collections"("invoiceId");

-- CreateIndex
CREATE INDEX "collections_dueDate_idx" ON "public"."collections"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_notes_deliveryNoteNumber_key" ON "public"."delivery_notes"("deliveryNoteNumber");

-- CreateIndex
CREATE INDEX "delivery_notes_distributorId_createdAt_idx" ON "public"."delivery_notes"("distributorId", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_notes_distributorId_status_idx" ON "public"."delivery_notes"("distributorId", "status");

-- CreateIndex
CREATE INDEX "delivery_notes_orderId_idx" ON "public"."delivery_notes"("orderId");

-- CreateIndex
CREATE INDEX "delivery_notes_scheduledDate_idx" ON "public"."delivery_notes"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "public"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_distributorId_createdAt_idx" ON "public"."invoices"("distributorId", "createdAt");

-- CreateIndex
CREATE INDEX "invoices_distributorId_status_idx" ON "public"."invoices"("distributorId", "status");

-- CreateIndex
CREATE INDEX "invoices_orderId_idx" ON "public"."invoices"("orderId");

-- AddForeignKey
ALTER TABLE "public"."collections" ADD CONSTRAINT "collections_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collections" ADD CONSTRAINT "collections_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collections" ADD CONSTRAINT "collections_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."salespeople"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_notes" ADD CONSTRAINT "delivery_notes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_notes" ADD CONSTRAINT "delivery_notes_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_notes" ADD CONSTRAINT "delivery_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
