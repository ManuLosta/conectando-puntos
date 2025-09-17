/*
  Warnings:

  - Added the required column `distributorId` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distributorId` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."inventory_items" ADD COLUMN     "distributorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "distributorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "inventory_items_distributorId_idx" ON "public"."inventory_items"("distributorId");

-- CreateIndex
CREATE INDEX "order_items_distributorId_idx" ON "public"."order_items"("distributorId");

-- CreateIndex
CREATE INDEX "products_distributorId_idx" ON "public"."products"("distributorId");

-- AddForeignKey
ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
