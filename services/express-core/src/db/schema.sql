-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    plan VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- 4. User Roles Junction Table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Candidates Table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    cv_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, email) -- Duplicate detection linked to candidate email
);

-- 7. Job Orders Table
CREATE TABLE job_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    fee_percentage NUMERIC(5,2) DEFAULT 15.00, -- e.g. 15.00% placement fee
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, FILLED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    job_order_id UUID REFERENCES job_orders(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL DEFAULT 'Applied', -- Applied, Screened, Shortlisted, Interviewed, Offered, Placed
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, job_order_id, candidate_id)
);

-- 9. Employees Table (Promoted candidates and outsourced registry)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    basic_salary NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    housing_allowance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    transport_allowance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    other_allowances NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Outsourced Contracts Table
CREATE TABLE outsourced_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, TERMINATED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Payrolls Table (Run tracking)
CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED (FO_APPROVED), HR_APPROVED, MD_APPROVED, CLIENT_APPROVED, LOCKED
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, client_id, period_month, period_year)
);

-- 12. Payroll Items Table (Deductions ledger)
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_id UUID REFERENCES payrolls(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary NUMERIC(15,2) NOT NULL,
    housing_allowance NUMERIC(15,2) DEFAULT 0.00,
    transport_allowance NUMERIC(15,2) DEFAULT 0.00,
    other_allowances NUMERIC(15,2) DEFAULT 0.00,
    gross_pay NUMERIC(15,2) NOT NULL,
    paye NUMERIC(15,2) DEFAULT 0.00,
    rssb_pension_employee NUMERIC(15,2) DEFAULT 0.00,
    rssb_pension_employer NUMERIC(15,2) DEFAULT 0.00,
    rssb_medical_employer NUMERIC(15,2) DEFAULT 0.00,
    cbhi_rama NUMERIC(15,2) DEFAULT 0.00,
    maternity_levy NUMERIC(15,2) DEFAULT 0.00,
    other_deductions NUMERIC(15,2) DEFAULT 0.00,
    total_deductions NUMERIC(15,2) NOT NULL,
    net_pay NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (payroll_id, employee_id)
);

-- 13. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Invoices Table (Generates draft placement invoice)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    job_order_id UUID REFERENCES job_orders(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, PAID, VOID
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Permits Table (Immigration permit tracking)
CREATE TABLE permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    permit_number VARCHAR(100) NOT NULL,
    permit_type VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'RW',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    expiry_date DATE NOT NULL,
    alert_90_sent BOOLEAN DEFAULT FALSE,
    alert_60_sent BOOLEAN DEFAULT FALSE,
    alert_30_sent BOOLEAN DEFAULT FALSE,
    alert_7_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Permit Checklist Items (Case-specific document requirements)
CREATE TABLE permit_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    permit_id UUID REFERENCES permits(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    file_key VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tenancy and high-traffic relationships
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_candidates_tenant ON candidates(tenant_id);
CREATE INDEX idx_job_orders_tenant ON job_orders(tenant_id);
CREATE INDEX idx_applications_tenant ON applications(tenant_id);
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_outsourced_contracts_tenant ON outsourced_contracts(tenant_id);
CREATE INDEX idx_payrolls_tenant ON payrolls(tenant_id);
CREATE INDEX idx_payroll_items_tenant ON payroll_items(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_permits_tenant ON permits(tenant_id);
CREATE INDEX idx_permit_checklist_items_tenant ON permit_checklist_items(tenant_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Helper function to check if RLS bypass is active (e.g. for user login or platform administration)
CREATE OR REPLACE FUNCTION is_rls_bypassed() RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.bypass_rls', true) = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE outsourced_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_checklist_items ENABLE ROW LEVEL SECURITY;

-- 2. Define Tenant-scoped access policies
-- Tenants can only see their own tenant record (or public/admin bypass)
CREATE POLICY tenants_tenant_isolation ON tenants
    USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Users isolation
CREATE POLICY users_tenant_isolation ON users
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Roles isolation
CREATE POLICY roles_tenant_isolation ON roles
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- User Roles isolation (inherits access from user profile)
CREATE POLICY user_roles_tenant_isolation ON user_roles
    USING (
        user_id IN (SELECT id FROM users)
        OR is_rls_bypassed()
    );

-- Clients isolation
CREATE POLICY clients_tenant_isolation ON clients
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Candidates isolation
CREATE POLICY candidates_tenant_isolation ON candidates
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Job Orders isolation
CREATE POLICY job_orders_tenant_isolation ON job_orders
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Applications isolation
CREATE POLICY applications_tenant_isolation ON applications
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Employees isolation
CREATE POLICY employees_tenant_isolation ON employees
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Deployed Outsourced Contracts isolation
CREATE POLICY outsourced_contracts_tenant_isolation ON outsourced_contracts
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Payroll Runs isolation
CREATE POLICY payrolls_tenant_isolation ON payrolls
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Payroll Items isolation
CREATE POLICY payroll_items_tenant_isolation ON payroll_items
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Audit Logs isolation
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Invoices isolation
CREATE POLICY invoices_tenant_isolation ON invoices
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Permits isolation
CREATE POLICY permits_tenant_isolation ON permits
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

-- Permit Checklist Items isolation
CREATE POLICY permit_checklist_items_tenant_isolation ON permit_checklist_items
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR is_rls_bypassed());

