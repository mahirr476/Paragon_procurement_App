-- CreateTable
CREATE TABLE "reject_pos" (
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
    "delivery_date" TEXT NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "igst" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "last_approved_rate" DOUBLE PRECISION NOT NULL,
    "last_supplier" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rejected',
    "delivery_type" TEXT NOT NULL,
    "open_po" TEXT NOT NULL,
    "open_po_no" TEXT NOT NULL,
    "rejected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reject_reason" TEXT,

    CONSTRAINT "reject_pos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reject_pos_order_no_idx" ON "reject_pos"("order_no");

-- CreateIndex
CREATE INDEX "reject_pos_status_idx" ON "reject_pos"("status");

-- CreateIndex
CREATE INDEX "reject_pos_rejected_at_idx" ON "reject_pos"("rejected_at");
