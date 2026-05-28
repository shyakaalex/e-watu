CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'LOCKED');
CREATE TYPE "PayrollFrequency" AS ENUM ('WEEKLY', 'BI_MONTHLY', 'MONTHLY');

CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_code" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_client_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "frequency" "PayrollFrequency" NOT NULL DEFAULT 'MONTHLY',
    "pay_date_day_of_month" INTEGER NOT NULL DEFAULT 28,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "pay_components" JSONB NOT NULL DEFAULT '[]',
    "statutory_rules" JSONB NOT NULL DEFAULT '{}',
    "custom_deductions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_client_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_lines" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "gross_pay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outsourcing_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "monthly_fee" DECIMAL(14,2),
    "currency" TEXT DEFAULT 'RWF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outsourcing_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employees_tenant_id_employee_code_key"
ON "employees"("tenant_id", "employee_code");

CREATE UNIQUE INDEX "payroll_client_configs_tenant_id_key"
ON "payroll_client_configs"("tenant_id");

CREATE UNIQUE INDEX "payroll_lines_run_id_employee_id_key"
ON "payroll_lines"("run_id", "employee_id");

CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");
CREATE INDEX "payroll_runs_tenant_id_period_year_period_month_idx" ON "payroll_runs"("tenant_id", "period_year", "period_month");
CREATE INDEX "payroll_lines_employee_id_idx" ON "payroll_lines"("employee_id");
CREATE INDEX "outsourcing_assignments_tenant_id_idx" ON "outsourcing_assignments"("tenant_id");
CREATE INDEX "outsourcing_assignments_employee_id_idx" ON "outsourcing_assignments"("employee_id");

ALTER TABLE "payroll_lines"
ADD CONSTRAINT "payroll_lines_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "payroll_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_lines"
ADD CONSTRAINT "payroll_lines_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
