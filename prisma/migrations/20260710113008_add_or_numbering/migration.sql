-- CreateTable
CREATE TABLE "or_number_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "or_number_counter_pkey" PRIMARY KEY ("id")
);
