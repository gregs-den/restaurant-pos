-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "merged_with_table_id" TEXT;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_merged_with_table_id_fkey" FOREIGN KEY ("merged_with_table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
