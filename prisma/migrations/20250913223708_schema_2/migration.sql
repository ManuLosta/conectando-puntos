/*
  Warnings:

  - The values [PENDIENTE,CONFIRMADA,EN_PREPARACION,EN_CAMINO,ENTREGADA,CANCELADA] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDIENTE,PAGADO,PARCIAL,RECHAZADO] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPERADMINISTRADOR,ADMINISTRADOR_DISTRIBUIDORA,VENDEDOR,CLIENTE_FINAL] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENTRADA,SALIDA,AJUSTE,TRANSFERENCIA] on the enum `StockMovementType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `distribuidoraId` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `vendedorId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `administradores_distribuidora` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cliente_distribuidora` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clientes_finales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `distribuidoras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `superadministradores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendedores` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId,distributorId]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `distributorId` to the `inventory_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PREPARATION', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."orders" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING ("status"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'REJECTED');
ALTER TABLE "public"."orders" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "public"."orders" ALTER COLUMN "paymentStatus" TYPE "public"."PaymentStatus_new" USING ("paymentStatus"::text::"public"."PaymentStatus_new");
ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "public"."PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "public"."orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('SUPER_ADMIN', 'DISTRIBUTOR_ADMIN', 'SALESPERSON', 'FINAL_CLIENT');
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."StockMovementType_new" AS ENUM ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER');
ALTER TABLE "public"."stock_movements" ALTER COLUMN "type" TYPE "public"."StockMovementType_new" USING ("type"::text::"public"."StockMovementType_new");
ALTER TYPE "public"."StockMovementType" RENAME TO "StockMovementType_old";
ALTER TYPE "public"."StockMovementType_new" RENAME TO "StockMovementType";
DROP TYPE "public"."StockMovementType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."administradores_distribuidora" DROP CONSTRAINT "administradores_distribuidora_distribuidoraId_fkey";

-- DropForeignKey
ALTER TABLE "public"."administradores_distribuidora" DROP CONSTRAINT "administradores_distribuidora_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cliente_distribuidora" DROP CONSTRAINT "cliente_distribuidora_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cliente_distribuidora" DROP CONSTRAINT "cliente_distribuidora_distribuidoraId_fkey";

-- DropForeignKey
ALTER TABLE "public"."clientes_finales" DROP CONSTRAINT "clientes_finales_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_items" DROP CONSTRAINT "inventory_items_distribuidoraId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_vendedorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."superadministradores" DROP CONSTRAINT "superadministradores_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vendedores" DROP CONSTRAINT "vendedores_userId_fkey";

-- DropIndex
DROP INDEX "public"."inventory_items_productId_distribuidoraId_key";

-- AlterTable
ALTER TABLE "public"."inventory_items" DROP COLUMN "distribuidoraId",
ADD COLUMN     "distributorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "clienteId",
DROP COLUMN "vendedorId",
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "salespersonId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "public"."administradores_distribuidora";

-- DropTable
DROP TABLE "public"."cliente_distribuidora";

-- DropTable
DROP TABLE "public"."clientes_finales";

-- DropTable
DROP TABLE "public"."distribuidoras";

-- DropTable
DROP TABLE "public"."superadministradores";

-- DropTable
DROP TABLE "public"."vendedores";

-- CreateTable
CREATE TABLE "public"."distributors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_distributors" (
    "id" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "discount" DECIMAL(5,2),
    "creditLimit" DECIMAL(10,2),
    "paymentTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."super_admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" TEXT[],

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."distributor_admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,

    CONSTRAINT "distributor_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salespeople" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "territory" TEXT,

    CONSTRAINT "salespeople_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."final_clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,

    CONSTRAINT "final_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_distributors_distributorId_clientId_key" ON "public"."client_distributors"("distributorId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_userId_key" ON "public"."super_admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_admins_userId_key" ON "public"."distributor_admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "salespeople_userId_key" ON "public"."salespeople"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "final_clients_userId_key" ON "public"."final_clients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_distributorId_key" ON "public"."inventory_items"("productId", "distributorId");

-- AddForeignKey
ALTER TABLE "public"."client_distributors" ADD CONSTRAINT "client_distributors_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_distributors" ADD CONSTRAINT "client_distributors_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."final_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."final_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "public"."salespeople"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."super_admins" ADD CONSTRAINT "super_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."distributor_admins" ADD CONSTRAINT "distributor_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."distributor_admins" ADD CONSTRAINT "distributor_admins_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salespeople" ADD CONSTRAINT "salespeople_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salespeople" ADD CONSTRAINT "salespeople_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."final_clients" ADD CONSTRAINT "final_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
