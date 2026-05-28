-- AlterTable
ALTER TABLE "outsourcing_assignments" ADD COLUMN "deployment_site" TEXT;

-- CreateTable
CREATE TABLE "outsourcing_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "contract_ref" TEXT,
    "billing_terms" JSONB NOT NULL DEFAULT '{}',
    "monthly_rate" DECIMAL(14,2),
    "currency" TEXT DEFAULT 'RWF',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outsourcing_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outsourcing_contracts_tenant_id_client_name_idx" ON "outsourcing_contracts"("tenant_id", "client_name");
