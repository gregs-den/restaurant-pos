-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'GCASH', 'MAYA', 'OTHER_EWALLET');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "subtotal" DECIMAL(10,2),
ADD COLUMN     "tax_amount" DECIMAL(10,2),
ADD COLUMN     "total_amount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference_no" TEXT,
    "received_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
