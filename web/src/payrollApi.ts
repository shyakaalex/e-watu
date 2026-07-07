import { authFetch, parseJson } from './lib/http';

function payrollUrl(): string {
  const base = import.meta.env.VITE_PAYROLL_API ?? 'http://localhost:3016';
  return base.replace(/\/$/, '');
}

export type Employee = {
  id: string;
  tenantId: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  baseSalary: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  startDate: string | null;
  placementId: string | null;
  candidateId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollConfig = {
  id: string;
  tenantId: string;
  frequency: 'WEEKLY' | 'BI_MONTHLY' | 'MONTHLY';
  payDateDayOfMonth: number;
  currency: string;
  payComponents: unknown[];
  statutoryRules: Record<string, unknown>;
  customDeductions: unknown[];
};

export type PayrollLine = {
  id: string;
  employeeId: string;
  grossPay: string;
  deductions: string;
  netPay: string;
  employee?: Employee;
};

export type PayrollRunApproval = {
  id: string;
  stage: 'FO' | 'HR' | 'MD' | 'CLIENT';
  status: 'INACTIVE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  actedBy: string | null;
  actedAt: string | null;
  note: string | null;
};

export type PayrollRun = {
  id: string;
  tenantId: string;
  periodYear: number;
  periodMonth: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'LOCKED';
  currency: string;
  submittedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  payrollLines?: PayrollLine[];
  approvals?: PayrollRunApproval[];
};

export type LeaveType = {
  id: string;
  code: string;
  name: string;
  paid: boolean;
  annualAllowanceDays: string | null;
  active: boolean;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string | null;
  employee?: Employee;
  leaveType?: LeaveType;
};

export type DeploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'RECALLED' | 'TRANSFERRED' | 'ON_BENCH';
export type OutsourcingEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'FIXED_TERM';
export type SecondmentContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';

export type OutsourcingAssignment = {
  id: string;
  tenantId: string;
  employeeId: string;
  clientName: string;
  clientId: string | null;
  roleName: string;
  deploymentSite: string | null;
  employmentType: OutsourcingEmploymentType;
  deploymentStatus: DeploymentStatus;
  startDate: string;
  endDate: string | null;
  availabilityDate: string | null;
  monthlyFee: string | null;
  currency: string;
  noticePeriodDays: number;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
  };
  contracts?: SecondmentContract[];
};

export type SecondmentContract = {
  id: string;
  tenantId: string;
  assignmentId: string;
  contractRef: string | null;
  clientName: string;
  role: string;
  billingRate: string;
  currency: string;
  workingHoursPerWeek: number;
  noticePeriodDays: number;
  governingLaw: string | null;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  status: SecondmentContractStatus;
  terminationReason: string | null;
  terminatedAt: string | null;
  terminatedBy: string | null;
  alert90Sent: boolean;
  alert60Sent: boolean;
  alert30Sent: boolean;
  s3Key: string | null;
  createdAt: string;
  updatedAt: string;
  assignment?: OutsourcingAssignment;
  amendments?: ContractAmendment[];
};

export type ContractAmendment = {
  id: string;
  tenantId: string;
  contractId: string;
  changedBy: string;
  reason: string;
  changesSummary: string;
  snapshotJson: Record<string, unknown>;
  createdAt: string;
};

export type DeploymentHistoryEntry = {
  id: string;
  tenantId: string;
  assignmentId: string;
  clientName: string;
  roleName: string;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  createdAt: string;
};


export type ChecklistItem = {
  id: string;
  label: string;
  required?: boolean;
  done?: boolean;
  doneAt?: string | null;
};

export type EmployeeOnboarding = {
  id: string;
  employeeId: string;
  templateId: string | null;
  items: ChecklistItem[];
  completedAt: string | null;
};

export type EmployeeOffboarding = {
  id: string;
  employeeId: string;
  items: ChecklistItem[];
  finalPayNote: string | null;
  completedAt: string | null;
};

async function payrollFetch(path: string, init?: RequestInit) {
  const r = await authFetch(`${payrollUrl()}${path}`, init);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r;
}

export async function fetchEmployees(
  params?:
    | string
    | Record<string, string | number | boolean | undefined>,
): Promise<Employee[] | { data: Employee[]; page: number; limit: number; total: number }> {
  const qs =
    typeof params === 'string'
      ? `?placementId=${encodeURIComponent(params)}`
      : params
        ? `?${new URLSearchParams(
            Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
              if (value !== undefined && value !== null && value !== '') acc[key] = String(value);
              return acc;
            }, {}),
          ).toString()}`
        : '';
  const r = await payrollFetch(`/api/v1/employees${qs}`);
  return parseJson(r);
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const r = await payrollFetch(`/api/v1/employees/${id}`);
  return parseJson(r);
}

export async function createEmployee(body: {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  baseSalary?: number;
  startDate?: string;
  placementId?: string;
  candidateId?: string;
}): Promise<Employee> {
  const r = await payrollFetch('/api/v1/employees', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function createEmployeeFromPlacement(body: {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  baseSalary?: number;
  startDate?: string;
  placementId?: string;
  candidateId?: string;
}): Promise<Employee> {
  const r = await payrollFetch('/api/v1/employees/from-placement', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function fetchPayrollConfigClients(): Promise<{ clientId: string }[]> {
  const r = await payrollFetch('/api/v1/payroll/config/clients');
  return parseJson(r);
}

export async function fetchPayrollConfig(clientId?: string): Promise<PayrollConfig> {
  const r = await payrollFetch(`/api/v1/payroll/config${clientId ? `/${clientId}` : ''}`);
  return parseJson(r);
}

export async function createPayrollConfig(body: Record<string, unknown>): Promise<PayrollConfig> {
  const r = await payrollFetch('/api/v1/payroll/config', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function updatePayrollConfig(
  clientIdOrBody: string | Partial<PayrollConfig>,
  maybeBody?: Partial<PayrollConfig>,
): Promise<PayrollConfig> {
  const clientId = typeof clientIdOrBody === 'string' ? clientIdOrBody : undefined;
  const body = typeof clientIdOrBody === 'string' ? maybeBody : clientIdOrBody;
  const r = await payrollFetch(`/api/v1/payroll/config${clientId ? `/${clientId}` : ''}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function fetchPayrollRuns(): Promise<PayrollRun[]> {
  const r = await payrollFetch('/api/v1/payroll/runs');
  return parseJson(r);
}

export async function fetchPayrollRun(id: string): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${id}`);
  return parseJson(r);
}

export async function createPayrollRun(body: {
  periodYear: number;
  periodMonth: number;
}): Promise<PayrollRun> {
  const r = await payrollFetch('/api/v1/payroll/runs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function submitPayrollRun(id: string): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return parseJson(r);
}

export async function lockPayrollRun(id: string): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${id}/lock`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return parseJson(r);
}

export async function recalculatePayrollRun(id: string): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${id}/recalculate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return parseJson(r);
}

export async function updatePayrollLine(
  runId: string,
  lineId: string,
  body: { grossPay?: number; deductions?: number },
): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${runId}/lines/${lineId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function approvePayrollStage(
  runId: string,
  stage: string,
  note?: string,
): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${runId}/approvals/${stage}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return parseJson(r);
}

export async function rejectPayrollStage(
  runId: string,
  stage: string,
  note?: string,
): Promise<PayrollRun> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${runId}/approvals/${stage}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return parseJson(r);
}

export async function fetchRunApprovals(runId: string) {
  const r = await payrollFetch(`/api/v1/payroll/runs/${runId}/approvals`);
  return parseJson(r);
}

export function reportDownloadUrl(runId: string, kind: 'paye' | 'rssb' | 'bank-file'): string {
  return `${payrollUrl()}/api/v1/payroll/runs/${runId}/reports/${kind}?format=csv`;
}

export function payslipZipUrl(runId: string): string {
  return `${payrollUrl()}/api/v1/payroll/runs/${runId}/payslips.zip`;
}

export async function emailPayslips(runId: string, employeeIds?: string[]): Promise<{ emailedCount: number }> {
  const r = await payrollFetch(`/api/v1/payroll/runs/${runId}/payslips/email`, {
    method: 'POST',
    body: JSON.stringify({ employeeIds }),
  });
  return parseJson(r);
}

// ── Outsourcing Assignments ───────────────────────────────────────

export async function fetchOutsourcingAssignments(
  params?: Record<string, string>,
): Promise<OutsourcingAssignment[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const r = await payrollFetch(`/api/v1/outsourcing/assignments${qs}`);
  return parseJson(r);
}

export async function fetchOutsourcingBench(): Promise<OutsourcingAssignment[]> {
  const r = await payrollFetch('/api/v1/outsourcing/bench');
  return parseJson(r);
}

export async function createOutsourcingAssignment(body: {
  employeeId: string;
  clientName: string;
  clientId?: string;
  roleName: string;
  deploymentSite?: string;
  employmentType?: string;
  startDate: string;
  endDate?: string;
  monthlyFee?: number;
  currency?: string;
  noticePeriodDays?: number;
}): Promise<OutsourcingAssignment> {
  const r = await payrollFetch('/api/v1/outsourcing/assignments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function updateOutsourcingAssignment(
  id: string,
  body: Partial<{
    clientName: string;
    roleName: string;
    deploymentSite: string;
    deploymentStatus: DeploymentStatus;
    employmentType: OutsourcingEmploymentType;
    endDate: string;
    availabilityDate: string;
    monthlyFee: number;
    currency: string;
    noticePeriodDays: number;
    transferReason: string;
  }>,
): Promise<OutsourcingAssignment> {
  const r = await payrollFetch(`/api/v1/outsourcing/assignments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function fetchDeploymentHistory(assignmentId: string): Promise<DeploymentHistoryEntry[]> {
  const r = await payrollFetch(`/api/v1/outsourcing/assignments/${assignmentId}/history`);
  return parseJson(r);
}

// ── Secondment Contracts ──────────────────────────────────────────

export async function fetchSecondmentContracts(
  params?: Record<string, string>,
): Promise<SecondmentContract[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const r = await payrollFetch(`/api/v1/outsourcing/contracts${qs}`);
  return parseJson(r);
}

export async function createSecondmentContract(body: {
  assignmentId: string;
  contractRef?: string;
  clientName: string;
  role: string;
  billingRate: number;
  currency?: string;
  workingHoursPerWeek?: number;
  noticePeriodDays?: number;
  governingLaw?: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
}): Promise<SecondmentContract> {
  const r = await payrollFetch('/api/v1/outsourcing/contracts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function updateSecondmentContract(
  id: string,
  body: Partial<{
    contractRef: string;
    role: string;
    billingRate: number;
    workingHoursPerWeek: number;
    noticePeriodDays: number;
    governingLaw: string;
    endDate: string;
    renewalDate: string;
    amendmentReason: string;
  }>,
): Promise<SecondmentContract> {
  const r = await payrollFetch(`/api/v1/outsourcing/contracts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function terminateSecondmentContract(
  id: string,
  body: { reason: string; terminationDate?: string },
): Promise<SecondmentContract> {
  const r = await payrollFetch(`/api/v1/outsourcing/contracts/${id}/terminate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function renewSecondmentContract(
  id: string,
  body: { newEndDate: string; renewalDate?: string; billingRate?: number; notes?: string },
): Promise<SecondmentContract> {
  const r = await payrollFetch(`/api/v1/outsourcing/contracts/${id}/renew`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function fetchContractAmendments(contractId: string): Promise<ContractAmendment[]> {
  const r = await payrollFetch(`/api/v1/outsourcing/contracts/${contractId}/amendments`);
  return parseJson(r);
}

// ── Billing ───────────────────────────────────────────────────────

export type OutsourcingBillingSummary = {
  period: string;
  periodYear: number;
  periodMonth: number;
  status: string;
  lineCount: number;
  lines: Array<{
    assignmentId: string;
    employeeId: string;
    employeeName: string;
    clientName: string;
    clientId: string | null;
    roleName: string;
    deploymentSite: string | null;
    billingRate: string;
    currency: string;
    period: string;
  }>;
  byClient: Record<string, OutsourcingBillingSummary['lines']>;
  totalsByCurrency: Record<string, string>;
};

export async function fetchOutsourcingBilling(period: string): Promise<OutsourcingBillingSummary> {
  const r = await payrollFetch(`/api/v1/outsourcing/billing/${encodeURIComponent(period)}`);
  return parseJson(r);
}

export type EmployeeP9Report = {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  year: number;
  currency: string;
  reportType: string;
  periods: Array<{
    periodYear: number;
    periodMonth: number;
    grossPay: string;
    deductions: string;
    netPay: string;
    paye: string;
    rssbPension: string;
    rssbMedical: string;
  }>;
  totals: Record<string, string>;
};

export async function fetchEmployeeP9(employeeId: string, year: number): Promise<EmployeeP9Report> {
  const r = await payrollFetch(`/api/v1/payroll/employees/${employeeId}/p9?year=${year}`);
  return parseJson(r);
}

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const r = await payrollFetch('/api/v1/hr/leave-types');
  return parseJson(r);
}

export async function fetchLeaveRequests(status?: string): Promise<LeaveRequest[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const r = await payrollFetch(`/api/v1/hr/leave-requests${qs}`);
  return parseJson(r);
}

export async function createLeaveRequest(body: {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days?: number;
  reason?: string;
}): Promise<LeaveRequest> {
  const r = await payrollFetch('/api/v1/hr/leave-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function approveLeaveRequest(id: string, note?: string): Promise<LeaveRequest> {
  const r = await payrollFetch(`/api/v1/hr/leave-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return parseJson(r);
}

export async function rejectLeaveRequest(id: string, note?: string): Promise<LeaveRequest> {
  const r = await payrollFetch(`/api/v1/hr/leave-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return parseJson(r);
}

export async function fetchEmployeeOnboarding(employeeId: string): Promise<EmployeeOnboarding | null> {
  const r = await payrollFetch(`/api/v1/hr/onboarding/employees/${employeeId}`);
  const data = await parseJson<EmployeeOnboarding | null>(r);
  return data ?? null;
}

export async function startEmployeeOnboarding(
  employeeId: string,
  templateId?: string,
): Promise<EmployeeOnboarding> {
  const r = await payrollFetch(`/api/v1/hr/onboarding/employees/${employeeId}`, {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
  return parseJson(r);
}

export async function toggleOnboardingItem(
  employeeId: string,
  itemId: string,
  done: boolean,
): Promise<EmployeeOnboarding> {
  const r = await payrollFetch(`/api/v1/hr/onboarding/employees/${employeeId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  });
  return parseJson(r);
}

export async function fetchEmployeeOffboarding(employeeId: string): Promise<EmployeeOffboarding | null> {
  const r = await payrollFetch(`/api/v1/hr/offboarding/employees/${employeeId}`);
  const data = await parseJson<EmployeeOffboarding | null>(r);
  return data ?? null;
}

export async function startEmployeeOffboarding(
  employeeId: string,
  finalPayNote?: string,
): Promise<EmployeeOffboarding> {
  const r = await payrollFetch(`/api/v1/hr/offboarding/employees/${employeeId}`, {
    method: 'POST',
    body: JSON.stringify({ finalPayNote }),
  });
  return parseJson(r);
}

export async function toggleOffboardingItem(
  employeeId: string,
  itemId: string,
  done: boolean,
  finalPayNote?: string,
): Promise<EmployeeOffboarding> {
  const r = await payrollFetch(`/api/v1/hr/offboarding/employees/${employeeId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ done, finalPayNote }),
  });
  return parseJson(r);
}

// Phase 3 endpoints
export async function updateEmployee(id: string, data: Record<string, unknown>) {
  const r = await payrollFetch(`/api/v1/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return parseJson(r);
}

export async function terminateEmployee(id: string) {
  const r = await payrollFetch(`/api/v1/employees/${id}`, { method: 'DELETE' });
  return parseJson(r);
}

export async function fetchContracts(employeeId: string) {
  const r = await payrollFetch(`/api/v1/employees/${employeeId}/contracts`);
  return parseJson(r);
}

export async function createContract(employeeId: string, data: Record<string, unknown>) {
  const r = await payrollFetch(`/api/v1/employees/${employeeId}/contracts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return parseJson(r);
}

export async function updateContract(id: string, data: Record<string, unknown>) {
  const r = await payrollFetch(`/api/v1/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return parseJson(r);
}

export async function uploadContractFile(id: string, objectKey: string) {
  const r = await payrollFetch(`/api/v1/contracts/${id}/upload`, {
    method: 'POST',
    body: JSON.stringify({ objectKey }),
  });
  return parseJson(r);
}

export async function fetchExpiringContracts(days = 30) {
  const r = await payrollFetch(`/api/v1/contracts/expiring?days=${days}`);
  return parseJson(r);
}

export async function fetchPeriods(params?: Record<string, string | number | undefined>) {
  const query = params
    ? `?${new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
          if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
          return acc;
        }, {}),
      )}`
    : '';
  const r = await payrollFetch(`/api/v1/payroll/periods${query}`);
  return parseJson(r);
}

export async function fetchPeriod(id: string) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${id}`);
  return parseJson(r);
}

export async function createPeriod(data: Record<string, unknown>) {
  const r = await payrollFetch('/api/v1/payroll/periods', { method: 'POST', body: JSON.stringify(data) });
  return parseJson(r);
}

export async function runPayroll(id: string) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${id}/run`, { method: 'POST', body: JSON.stringify({}) });
  return parseJson(r);
}

export async function submitPayroll(id: string) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${id}/submit`, { method: 'POST', body: JSON.stringify({}) });
  return parseJson(r);
}

export async function approvePayroll(id: string, data?: Record<string, unknown>) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
  return parseJson(r);
}

export async function rejectPayroll(id: string, comments?: string) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comments }),
  });
  return parseJson(r);
}

export async function finalizePayroll(id: string) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${id}/finalize`, { method: 'POST', body: JSON.stringify({}) });
  return parseJson(r);
}

export const downloadPAYEReport = (periodId: string) =>
  window.open(`${payrollUrl()}/api/v1/payroll/reports/paye?periodId=${periodId}`, '_blank');
export const downloadRSSBReport = (periodId: string) =>
  window.open(`${payrollUrl()}/api/v1/payroll/reports/rssb?periodId=${periodId}`, '_blank');
export const downloadBankFile = (periodId: string) =>
  window.open(`${payrollUrl()}/api/v1/payroll/reports/bank-file/${periodId}`, '_blank');

export async function fetchEmployeePayslips(employeeId: string) {
  const r = await payrollFetch(`/api/v1/payroll/payslips/${employeeId}`);
  return parseJson(r);
}

export async function fetchPeriodPayslips(periodId: string) {
  const r = await payrollFetch(`/api/v1/payroll/periods/${periodId}/payslips`);
  return parseJson(r);
}

export async function fetchLeaveBalances(employeeId: string, year?: number) {
  const query = year ? `?employeeId=${employeeId}&year=${year}` : `?employeeId=${employeeId}`;
  const r = await payrollFetch(`/api/v1/hr/leave-balances${query}`);
  return parseJson(r);
}

// --- PERFORMANCE API ---

export async function fetchAppraisalCycles() {
  const r = await payrollFetch('/api/v1/performance/cycles');
  return parseJson(r);
}

export async function createAppraisalCycle(body: any) {
  const r = await payrollFetch('/api/v1/performance/cycles', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function updateAppraisalCycleStatus(id: string, status: string) {
  const r = await payrollFetch(`/api/v1/performance/cycles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return parseJson(r);
}

export async function fetchGoals(employeeId?: string, appraisalCycleId?: string) {
  let query = '';
  const params: string[] = [];
  if (employeeId) params.push(`employeeId=${employeeId}`);
  if (appraisalCycleId) params.push(`appraisalCycleId=${appraisalCycleId}`);
  if (params.length > 0) query = `?${params.join('&')}`;

  const r = await payrollFetch(`/api/v1/performance/goals${query}`);
  return parseJson(r);
}

export async function createGoal(body: any) {
  const r = await payrollFetch('/api/v1/performance/goals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function updateGoal(id: string, body: any) {
  const r = await payrollFetch(`/api/v1/performance/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function deleteGoal(id: string) {
  const r = await payrollFetch(`/api/v1/performance/goals/${id}`, {
    method: 'DELETE',
  });
  return parseJson(r);
}

export async function fetchGoalTemplates() {
  const r = await payrollFetch('/api/v1/performance/goals/templates');
  return parseJson(r);
}

export async function createGoalTemplate(body: any) {
  const r = await payrollFetch('/api/v1/performance/goals/templates', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function fetchCompetencyFramework() {
  const r = await payrollFetch('/api/v1/performance/competencies');
  return parseJson(r);
}

export async function fetchAppraisals(employeeId?: string, managerId?: string) {
  let query = '';
  const params: string[] = [];
  if (employeeId) params.push(`employeeId=${employeeId}`);
  if (managerId) params.push(`managerId=${managerId}`);
  if (params.length > 0) query = `?${params.join('&')}`;

  const r = await payrollFetch(`/api/v1/performance/appraisals${query}`);
  return parseJson(r);
}

export async function fetchAppraisal(id: string) {
  const r = await payrollFetch(`/api/v1/performance/appraisals/${id}`);
  return parseJson(r);
}

export async function submitSelfAssessment(id: string, body: any) {
  const r = await payrollFetch(`/api/v1/performance/appraisals/${id}/self-assess`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function submitManagerReview(id: string, body: any) {
  const r = await payrollFetch(`/api/v1/performance/appraisals/${id}/manager-review`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function submitHRValidation(id: string, body: any) {
  const r = await payrollFetch(`/api/v1/performance/appraisals/${id}/hr-validate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function fetchFeedbackRequests(reviewerId?: string, employeeId?: string) {
  let query = '';
  const params: string[] = [];
  if (reviewerId) params.push(`reviewerId=${reviewerId}`);
  if (employeeId) params.push(`employeeId=${employeeId}`);
  if (params.length > 0) query = `?${params.join('&')}`;

  const r = await payrollFetch(`/api/v1/performance/360-feedback/requests${query}`);
  return parseJson(r);
}

export async function createFeedbackRequest(body: any) {
  const r = await payrollFetch('/api/v1/performance/360-feedback/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

export async function submitFeedbackResponse(requestId: string, body: any) {
  const r = await payrollFetch(`/api/v1/performance/360-feedback/requests/${requestId}/response`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseJson(r);
}

