/*
  Warnings:

  - You are about to drop the column `idempotency_key` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotency_key]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_idempotency_key_key";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "idempotency_key" TEXT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "idempotency_key";

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
