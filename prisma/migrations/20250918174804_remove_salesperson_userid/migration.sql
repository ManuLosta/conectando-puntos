/*
  Warnings:

  - You are about to drop the column `userId` on the `salespeople` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."salespeople_userId_key";

-- AlterTable
ALTER TABLE "public"."salespeople" DROP COLUMN "userId";
