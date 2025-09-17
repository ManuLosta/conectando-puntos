-- CreateIndex
CREATE INDEX "inventory_items_productId_expirationDate_idx" ON "public"."inventory_items"("productId", "expirationDate");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "public"."order_items"("productId");

-- CreateIndex
CREATE INDEX "orders_distributorId_createdAt_idx" ON "public"."orders"("distributorId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_clientId_distributorId_createdAt_idx" ON "public"."orders"("clientId", "distributorId", "createdAt");
