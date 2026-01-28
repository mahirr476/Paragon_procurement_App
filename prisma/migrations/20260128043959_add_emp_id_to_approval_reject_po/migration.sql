-- AlterTable
ALTER TABLE "approval_pos" ADD COLUMN     "emp_id" TEXT;

-- AlterTable
ALTER TABLE "reject_pos" ADD COLUMN     "emp_id" TEXT;

-- CreateIndex
CREATE INDEX "approval_pos_emp_id_idx" ON "approval_pos"("emp_id");

-- CreateIndex
CREATE INDEX "reject_pos_emp_id_idx" ON "reject_pos"("emp_id");
