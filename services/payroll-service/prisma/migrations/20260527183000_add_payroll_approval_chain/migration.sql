CREATE TYPE "ApprovalStage" AS ENUM ('FO', 'HR', 'MD', 'CLIENT');
CREATE TYPE "ApprovalStatus" AS ENUM ('INACTIVE', 'PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "payroll_run_approvals" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'INACTIVE',
    "acted_by" TEXT,
    "acted_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_run_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payroll_run_approvals_run_id_stage_key"
ON "payroll_run_approvals"("run_id", "stage");

CREATE INDEX "payroll_run_approvals_run_id_status_idx"
ON "payroll_run_approvals"("run_id", "status");

ALTER TABLE "payroll_run_approvals"
ADD CONSTRAINT "payroll_run_approvals_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "payroll_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
