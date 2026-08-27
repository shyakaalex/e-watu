export const ROLE_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  TENANT_STAFF: {
    label: 'Employee Staff',
    desc: 'Employee self-service (payslips, leave requests, KPI self-assessments)',
  },
  HR_MANAGER: {
    label: 'HR / Department Head',
    desc: 'Department leadership (approve team leave, rate team KPIs, manage placements)',
  },
  FINANCE_OFFICER: {
    label: 'Finance Officer',
    desc: 'Payroll calculations, tax reports, and client billing',
  },
  RECRUITER: {
    label: 'Recruiter',
    desc: 'Candidate sourcing, job postings, talent pool management',
  },
  TENANT_ADMIN: {
    label: 'Company Admin',
    desc: 'Full workspace administrative control and user creation',
  },
  MANAGING_DIRECTOR: {
    label: 'Managing Director',
    desc: 'Executive oversight — approves Team KPIs and other cross-department decisions',
  },
};

export const ROLE_OPTIONS = Object.keys(ROLE_DESCRIPTIONS);
