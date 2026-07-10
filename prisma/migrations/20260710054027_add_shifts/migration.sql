-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "starting_cash" DECIMAL(10,2) NOT NULL,
    "ending_cash_counted" DECIMAL(10,2),
    "expected_cash" DECIMAL(10,2),
    "over_short" DECIMAL(10,2),
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);
