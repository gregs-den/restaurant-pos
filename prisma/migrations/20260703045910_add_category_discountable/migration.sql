/*
  Warnings:

  - You are about to drop the column `is_discountable` on the `promos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "is_discountable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "promos" DROP COLUMN "is_discountable";
