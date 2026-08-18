import { executeQuery, executeTransaction } from '../../db/client';

export interface TaxBand {
  min: number;
  max: number | null;
  rate: number;
}

export interface PayrollConfig {
  payeEnabled: boolean;
  taxBands: TaxBand[];
  rssbPensionEmployeeRate: number;
  rssbPensionEmployerRate: number;
  rssbMedicalRate: number;
  cbhiRate: number;
  maternityLevyRate: number;
}

export interface PayrollInput {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  otherDeductions: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossPay: number;
  paye: number;
  rssbPensionEmployee: number;
  rssbPensionEmployer: number;
  rssbMedicalEmployer: number;
  cbhiRama: number;
  maternityLevy: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

// Default Rwanda Tax Bands (Updated 2023 Rules)
export const DEFAULT_RWANDA_TAX_BANDS: TaxBand[] = [
  { min: 0, max: 60000, rate: 0.00 },        // Up to 60,000 RWF -> 0%
  { min: 60000, max: 100000, rate: 0.10 },    // 60,001 to 100,000 RWF -> 10%
  { min: 100000, max: 1000000, rate: 0.20 },  // 100,001 to 1,000,000 RWF -> 20%
  { min: 1000000, max: null, rate: 0.30 }     // Above 1,000,000 RWF -> 30%
];

// Default configuration details for calculations
export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  payeEnabled: true,
  taxBands: DEFAULT_RWANDA_TAX_BANDS,
  rssbPensionEmployeeRate: 0.05,
  rssbPensionEmployerRate: 0.05,
  rssbMedicalRate: 0.075,
  cbhiRate: 0.005,
  maternityLevyRate: 0.003
};

/**
 * Pure calculation function for Rwanda statutory deductions
 */
export function calculateEmployeePayroll(
  input: PayrollInput,
  config: PayrollConfig = DEFAULT_PAYROLL_CONFIG
): PayrollCalculationResult {
  const basicSalary = Number(input.basicSalary);
  const housingAllowance = Number(input.housingAllowance);
  const transportAllowance = Number(input.transportAllowance);
  const otherAllowances = Number(input.otherAllowances);
  const otherDeductions = Number(input.otherDeductions);

  const grossPay = basicSalary + housingAllowance + transportAllowance + otherAllowances;

  // 1. Calculate PAYE
  let paye = 0;
  if (config.payeEnabled) {
    for (const band of config.taxBands) {
      if (grossPay <= band.min) {
        continue;
      }
      const upperLimit = band.max !== null ? band.max : grossPay;
      const taxableInBand = Math.min(grossPay, upperLimit) - band.min;
      if (taxableInBand > 0) {
        paye += taxableInBand * band.rate;
      }
    }
  }

  // 2. RSSB Pension (Employee: 5%, Employer: 5% of gross pay)
  const rssbPensionEmployee = grossPay * config.rssbPensionEmployeeRate;
  const rssbPensionEmployer = grossPay * config.rssbPensionEmployerRate;

  // 3. RSSB Medical (7.5% of gross pay, employer cost)
  const rssbMedicalEmployer = grossPay * config.rssbMedicalRate;

  // 4. CBHI/RAMA (0.5% employee contribution)
  const cbhiRama = grossPay * config.cbhiRate;

  // 5. Maternity Levy (0.3% of gross salary - usually paid by employer or split, let's define as employer-paid or total deduction)
  const maternityLevy = grossPay * config.maternityLevyRate;

  // Total deductions from employee: PAYE + RSSB Employee Pension + CBHI/RAMA + Other Deductions
  const totalDeductions = paye + rssbPensionEmployee + cbhiRama + otherDeductions;
  
  // Net Pay = Gross Pay - Total Deductions
  const netPay = grossPay - totalDeductions;

  return {
    basicSalary,
    housingAllowance,
    transportAllowance,
    otherAllowances,
    grossPay,
    paye,
    rssbPensionEmployee,
    rssbPensionEmployer,
    rssbMedicalEmployer,
    cbhiRama,
    maternityLevy,
    otherDeductions,
    totalDeductions,
    netPay
  };
}

/**
 * Initiates a new payroll run, calculates for all active employees, and stores items
 */
export async function initiatePayrollRun(
  tenantId: string,
  clientId: string,
  periodMonth: number,
  periodYear: number,
  userId: string
) {
  return executeTransaction(async (client) => {
    // 1. Check if run already exists
    const checkQuery = `
      SELECT id FROM payrolls 
      WHERE tenant_id = $1 AND client_id = $2 AND period_month = $3 AND period_year = $4
    `;
    const checkRes = await client.query(checkQuery, [tenantId, clientId, periodMonth, periodYear]);
    if (checkRes.rows.length > 0) {
      throw new Error('A payroll run already exists for this client and period.');
    }

    // 2. Create the payroll run in DRAFT status
    const insertRun = `
      INSERT INTO payrolls (tenant_id, client_id, period_month, period_year, status, created_by)
      VALUES ($1, $2, $3, $4, 'DRAFT', $5)
      RETURNING id, status, period_month, period_year
    `;
    const runRes = await client.query(insertRun, [tenantId, clientId, periodMonth, periodYear, userId]);
    const run = runRes.rows[0];

    // 3. Fetch active employees for this client
    const empQuery = `
      SELECT id, basic_salary, housing_allowance, transport_allowance, other_allowances 
      FROM employees 
      WHERE tenant_id = $1 AND client_id = $2 AND active = TRUE
    `;
    const empRes = await client.query(empQuery, [tenantId, clientId]);
    const employees = empRes.rows;

    // 4. Calculate payroll for each employee and insert into payroll_items
    for (const emp of employees) {
      const calcInput: PayrollInput = {
        basicSalary: Number(emp.basic_salary),
        housingAllowance: Number(emp.housing_allowance),
        transportAllowance: Number(emp.transport_allowance),
        otherAllowances: Number(emp.other_allowances),
        otherDeductions: 0.00 // Default other deductions to 0 during initial run
      };

      const result = calculateEmployeePayroll(calcInput);

      const insertItem = `
        INSERT INTO payroll_items (
          tenant_id, payroll_id, employee_id, basic_salary, housing_allowance, 
          transport_allowance, other_allowances, gross_pay, paye, 
          rssb_pension_employee, rssb_pension_employer, rssb_medical_employer, 
          cbhi_rama, maternity_levy, other_deductions, total_deductions, net_pay
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;
      await client.query(insertItem, [
        tenantId,
        run.id,
        emp.id,
        result.basicSalary,
        result.housingAllowance,
        result.transportAllowance,
        result.otherAllowances,
        result.grossPay,
        result.paye,
        result.rssbPensionEmployee,
        result.rssbPensionEmployer,
        result.rssbMedicalEmployer,
        result.cbhiRama,
        result.maternityLevy,
        result.otherDeductions,
        result.totalDeductions,
        result.netPay
      ]);
    }

    // 5. Add audit log
    const auditQuery = `
      INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, payload)
      VALUES ($1, $2, 'CREATE_RUN', 'payrolls', $3, $4)
    `;
    await client.query(auditQuery, [
      tenantId,
      userId,
      run.id,
      JSON.stringify({ clientId, periodMonth, periodYear })
    ]);

    return run;
  });
}

/**
 * Advances the payroll run through its approval workflow
 */
export async function advancePayrollStatus(
  tenantId: string,
  runId: string,
  nextStatus: string,
  userId: string,
  comments?: string
) {
  return executeTransaction(async (client) => {
    // 1. Fetch current run
    const runQuery = `SELECT status, period_month, period_year FROM payrolls WHERE id = $1 AND tenant_id = $2`;
    const runRes = await client.query(runQuery, [runId, tenantId]);
    if (runRes.rows.length === 0) {
      throw new Error('Payroll run not found.');
    }

    const currentStatus = runRes.rows[0].status;

    // 2. Guard against modified locked runs
    if (currentStatus === 'LOCKED') {
      throw new Error('Cannot modify a finalized and locked payroll run.');
    }

    // 3. Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['SUBMITTED'],
      'SUBMITTED': ['HR_APPROVED', 'DRAFT'], // Reject to DRAFT
      'HR_APPROVED': ['MD_APPROVED', 'DRAFT'],
      'MD_APPROVED': ['CLIENT_APPROVED', 'DRAFT'],
      'CLIENT_APPROVED': ['LOCKED', 'DRAFT']
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}.`);
    }

    // 4. Update status
    const updateQuery = `
      UPDATE payrolls 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, status, period_month, period_year
    `;
    const updateRes = await client.query(updateQuery, [nextStatus, runId, tenantId]);
    const updatedRun = updateRes.rows[0];

    // 5. Audit Log the change
    const auditQuery = `
      INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, payload)
      VALUES ($1, $2, $3, 'payrolls', $4, $5)
    `;
    await client.query(auditQuery, [
      tenantId,
      userId,
      `STATUS_TRANSITION_${nextStatus}`,
      runId,
      JSON.stringify({ from: currentStatus, to: nextStatus, comments })
    ]);

    return updatedRun;
  });
}
