/*
  Warnings:

  - The values [SALESPERSON,FINAL_CLIENT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `distributorId` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `maxStock` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `minStock` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `super_admins` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `final_clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,lotNumber]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,distributorId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `salespeople` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expirationDate` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lotNumber` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distributorId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distributorId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('SUPER_ADMIN', 'DISTRIBUTOR_ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."final_clients" DROP CONSTRAINT "final_clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_items" DROP CONSTRAINT "inventory_items_distributorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."salespeople" DROP CONSTRAINT "salespeople_userId_fkey";

-- DropIndex
DROP INDEX "public"."inventory_items_productId_distributorId_key";

-- DropIndex
DROP INDEX "public"."products_sku_key";

-- AlterTable
ALTER TABLE "public"."final_clients" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "public"."inventory_items" DROP COLUMN "distributorId",
DROP COLUMN "maxStock",
DROP COLUMN "minStock",
ADD COLUMN     "expirationDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lotNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "distributorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "distributorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."salespeople" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "public"."super_admins" DROP COLUMN "permissions";

-- CreateIndex
CREATE UNIQUE INDEX "final_clients_phone_key" ON "public"."final_clients"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_lotNumber_key" ON "public"."inventory_items"("productId", "lotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_distributorId_key" ON "public"."products"("sku", "distributorId");

-- CreateIndex
CREATE UNIQUE INDEX "salespeople_phone_key" ON "public"."salespeople"("phone");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
