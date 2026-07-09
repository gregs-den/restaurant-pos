-- CreateEnum
CREATE TYPE "VoidType" AS ENUM ('ITEM', 'ORDER');

-- CreateTable
CREATE TABLE "void_logs" (
    "id" TEXT NOT NULL,
    "type" "VoidType" NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_item_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "voided_by" TEXT NOT NULL,
    "approved_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "void_logs_pkey" PRIMARY KEY ("id")
);
