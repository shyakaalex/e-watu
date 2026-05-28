DROP TABLE IF EXISTS payroll_run_approvals;
DROP TABLE IF EXISTS payroll_lines;
DROP TABLE IF EXISTS payroll_runs;
DROP TABLE IF EXISTS payroll_client_configs;

DO $$ BEGIN
  CREATE TYPE "EmployeeType" AS ENUM ('INTERNAL', 'OUTSOURCED', 'SECONDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'FIXED_TERM', 'SECONDMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "PeriodStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'HR_APPROVED', 'MD_APPROVED', 'CLIENT_APPROVED', 'FINALIZED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ApproverRole" AS ENUM ('HR_MANAGER', 'MD', 'CLIENT_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS payroll_configurations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  pay_frequency TEXT NOT NULL DEFAULT 'MONTHLY',
  pay_day INTEGER NOT NULL DEFAULT 28,
  currency TEXT NOT NULL DEFAULT 'RWF',
  paye_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rssb_pension_employee DECIMAL(6,4) NOT NULL DEFAULT 0.05,
  rssb_pension_employer DECIMAL(6,4) NOT NULL DEFAULT 0.05,
  rssb_medical DECIMAL(6,4) NOT NULL DEFAULT 0.075,
  cbhi_rate DECIMAL(6,4) NOT NULL DEFAULT 0.005,
  maternity_levy DECIMAL(6,4) NOT NULL DEFAULT 0.003,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS payroll_configurations_tenant_id_client_id_key ON payroll_configurations (tenant_id, client_id);
CREATE INDEX IF NOT EXISTS payroll_configurations_tenant_id_idx ON payroll_configurations (tenant_id);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  candidate_id TEXT,
  client_id TEXT,
  employee_type "EmployeeType" NOT NULL DEFAULT 'OUTSOURCED',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  national_id_encrypted TEXT,
  date_of_birth TIMESTAMP(3),
  gender TEXT,
  nationality TEXT,
  department TEXT,
  job_title TEXT NOT NULL,
  start_date TIMESTAMP(3) NOT NULL,
  end_date TIMESTAMP(3),
  employment_status "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
  manager_id TEXT,
  basic_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  housing_allowance DECIMAL(15,2) NOT NULL DEFAULT 0,
  transport_allowance DECIMAL(15,2) NOT NULL DEFAULT 0,
  other_allowances DECIMAL(15,2) NOT NULL DEFAULT 0,
  bank_account_encrypted TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL
);
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_manager_id_fkey;
ALTER TABLE employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS employees_tenant_id_idx ON employees (tenant_id);
CREATE INDEX IF NOT EXISTS employees_tenant_id_client_id_idx ON employees (tenant_id, client_id);
CREATE INDEX IF NOT EXISTS employees_tenant_id_employment_status_idx ON employees (tenant_id, employment_status);

CREATE TABLE IF NOT EXISTS employee_contracts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  contract_type "ContractType" NOT NULL DEFAULT 'PERMANENT',
  start_date TIMESTAMP(3) NOT NULL,
  end_date TIMESTAMP(3),
  salary DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  s3_key TEXT,
  status "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
  expiry_alert_90_sent BOOLEAN NOT NULL DEFAULT FALSE,
  expiry_alert_60_sent BOOLEAN NOT NULL DEFAULT FALSE,
  expiry_alert_30_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE employee_contracts DROP CONSTRAINT IF EXISTS employee_contracts_employee_id_fkey;
ALTER TABLE employee_contracts ADD CONSTRAINT employee_contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS employee_contracts_tenant_id_idx ON employee_contracts (tenant_id);
CREATE INDEX IF NOT EXISTS employee_contracts_employee_id_idx ON employee_contracts (employee_id);
CREATE INDEX IF NOT EXISTS employee_contracts_tenant_id_status_idx ON employee_contracts (tenant_id, status);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status "PeriodStatus" NOT NULL DEFAULT 'DRAFT',
  prepared_by TEXT,
  submitted_at TIMESTAMP(3),
  hr_approved_at TIMESTAMP(3),
  hr_approved_by TEXT,
  md_approved_at TIMESTAMP(3),
  md_approved_by TEXT,
  client_approved_at TIMESTAMP(3),
  client_approved_by TEXT,
  finalized_at TIMESTAMP(3),
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS payroll_periods_tenant_id_client_id_period_month_period_year_key
  ON payroll_periods (tenant_id, client_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS payroll_periods_tenant_id_idx ON payroll_periods (tenant_id);
CREATE INDEX IF NOT EXISTS payroll_periods_tenant_id_client_id_idx ON payroll_periods (tenant_id, client_id);
CREATE INDEX IF NOT EXISTS payroll_periods_tenant_id_status_idx ON payroll_periods (tenant_id, status);

CREATE TABLE IF NOT EXISTS payroll_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  basic_salary DECIMAL(15,2) NOT NULL,
  housing_allowance DECIMAL(15,2) NOT NULL DEFAULT 0,
  transport_allowance DECIMAL(15,2) NOT NULL DEFAULT 0,
  other_allowances DECIMAL(15,2) NOT NULL DEFAULT 0,
  gross_pay DECIMAL(15,2) NOT NULL,
  paye DECIMAL(15,2) NOT NULL DEFAULT 0,
  rssb_employee DECIMAL(15,2) NOT NULL DEFAULT 0,
  rssb_employer DECIMAL(15,2) NOT NULL DEFAULT 0,
  rssb_medical DECIMAL(15,2) NOT NULL DEFAULT 0,
  cbhi DECIMAL(15,2) NOT NULL DEFAULT 0,
  maternity_levy DECIMAL(15,2) NOT NULL DEFAULT 0,
  other_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(15,2) NOT NULL,
  net_pay DECIMAL(15,2) NOT NULL,
  payslip_s3_key TEXT,
  payslip_generated_at TIMESTAMP(3)
);
ALTER TABLE payroll_records DROP CONSTRAINT IF EXISTS payroll_records_period_id_fkey;
ALTER TABLE payroll_records ADD CONSTRAINT payroll_records_period_id_fkey FOREIGN KEY (period_id) REFERENCES payroll_periods(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE payroll_records DROP CONSTRAINT IF EXISTS payroll_records_employee_id_fkey;
ALTER TABLE payroll_records ADD CONSTRAINT payroll_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS payroll_records_period_id_employee_id_key ON payroll_records (period_id, employee_id);
CREATE INDEX IF NOT EXISTS payroll_records_tenant_id_idx ON payroll_records (tenant_id);
CREATE INDEX IF NOT EXISTS payroll_records_period_id_idx ON payroll_records (period_id);

CREATE TABLE IF NOT EXISTS payroll_approvals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  approver_role "ApproverRole" NOT NULL,
  approver_id TEXT NOT NULL,
  action "ApprovalAction" NOT NULL,
  comments TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE payroll_approvals DROP CONSTRAINT IF EXISTS payroll_approvals_period_id_fkey;
ALTER TABLE payroll_approvals ADD CONSTRAINT payroll_approvals_period_id_fkey FOREIGN KEY (period_id) REFERENCES payroll_periods(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS payroll_approvals_period_id_idx ON payroll_approvals (period_id);

CREATE TABLE IF NOT EXISTS bank_payment_files (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  s3_key TEXT,
  generated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  record_count INTEGER NOT NULL
);
ALTER TABLE bank_payment_files DROP CONSTRAINT IF EXISTS bank_payment_files_period_id_fkey;
ALTER TABLE bank_payment_files ADD CONSTRAINT bank_payment_files_period_id_fkey FOREIGN KEY (period_id) REFERENCES payroll_periods(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS bank_payment_files_period_id_idx ON bank_payment_files (period_id);
