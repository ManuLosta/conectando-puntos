/*
  Warnings:

  - You are about to drop the `client_distributors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `final_clients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."client_distributors" DROP CONSTRAINT "client_distributors_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."client_distributors" DROP CONSTRAINT "client_distributors_distributorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_clientId_fkey";

-- DropTable
DROP TABLE "public"."client_distributors";

-- DropTable
DROP TABLE "public"."final_clients";

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "clientType" TEXT,
    "notes" TEXT,
    "assignedSalespersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_phone_key" ON "public"."clients"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "public"."clients"("email");

-- CreateIndex
CREATE INDEX "clients_distributorId_createdAt_idx" ON "public"."clients"("distributorId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_assignedSalespersonId_fkey" FOREIGN KEY ("assignedSalespersonId") REFERENCES "public"."salespeople"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
