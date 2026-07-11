/*
  Warnings:

  - A unique constraint covering the columns `[or_number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "or_number" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "orders_or_number_key" ON "orders"("or_number");
