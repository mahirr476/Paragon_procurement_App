-- CreateTable
CREATE TABLE "pending_pos" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "ref_no" TEXT NOT NULL,
    "due_date" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "requisition_type" TEXT NOT NULL,
    "item_ledger_group" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "min_qty" DOUBLE PRECISION NOT NULL,
    "max_qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "last_approved_rate" DOUBLE PRECISION NOT NULL,
    "last_supplier" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "approval_level" TEXT NOT NULL,
    "emp_id" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pending_pos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_pos_order_no_idx" ON "pending_pos"("order_no");

-- CreateIndex
CREATE INDEX "pending_pos_status_idx" ON "pending_pos"("status");

-- CreateIndex
CREATE INDEX "pending_pos_is_processed_idx" ON "pending_pos"("is_processed");
