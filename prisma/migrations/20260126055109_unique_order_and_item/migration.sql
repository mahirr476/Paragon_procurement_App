/*
  Warnings:

  - A unique constraint covering the columns `[order_no,item]` on the table `pending_pos` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "pending_pos_order_no_key";

-- CreateIndex
CREATE UNIQUE INDEX "pending_pos_order_no_item_key" ON "pending_pos"("order_no", "item");
