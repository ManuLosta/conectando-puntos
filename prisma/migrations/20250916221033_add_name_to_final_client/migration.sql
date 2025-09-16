/*
  Warnings:

  - Added the required column `name` to the `final_clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."final_clients" ADD COLUMN     "name" TEXT NOT NULL;
