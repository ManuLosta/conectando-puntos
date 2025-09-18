-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "discount" DECIMAL(4,2),
ADD COLUMN     "discountedPrice" DECIMAL(10,2);
