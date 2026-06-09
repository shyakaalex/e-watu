import { calculateCBHI } from './cbhi.calculator';
import { calculatePAYE } from './paye.calculator';
import { calculateRSSB } from './rssb.calculator';

export interface PayrollInput {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  otherDeductions: number;
}

export interface EmployeeDeductions {
  paye: number;
  rssbEmployee: number;
  rssbMedical: number;
  cbhi: number;
  otherDeductions: number;
  totalDeductions: number;
}

export interface EmployerCosts {
  rssbEmployer: number;
  maternityLevy: number;
}

export interface PayrollResult {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossPay: number;
  paye: number;
  rssbEmployee: number;
  rssbEmployer: number;
  rssbMedical: number;
  cbhi: number;
  maternityLevy: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  employeeDeductions: EmployeeDeductions;
  employerCosts: EmployerCosts;
}

export interface PayrollConfig {
  payeEnabled: boolean;
  rssbPensionEmployee: number;
  rssbPensionEmployer: number;
  rssbMedical: number;
  cbhiRate: number;
  maternityLevy: number;
}

export function calculatePayroll(input: PayrollInput, config: PayrollConfig): PayrollResult {
  const grossPay =
    input.basicSalary + input.housingAllowance + input.transportAllowance + input.otherAllowances;
  const paye = config.payeEnabled ? calculatePAYE(grossPay) : 0;
  const rssb = calculateRSSB(
    grossPay,
    config.rssbPensionEmployee,
    config.rssbPensionEmployer,
    config.rssbMedical,
  );
  const cbhi = calculateCBHI(grossPay, config.cbhiRate);
  const maternityLevy = grossPay * config.maternityLevy;
  const totalDeductions =
    paye + rssb.rssbEmployee + rssb.rssbMedical + cbhi + input.otherDeductions;
  const netPay = grossPay - totalDeductions;

  const employeeDeductions: EmployeeDeductions = {
    paye,
    rssbEmployee: rssb.rssbEmployee,
    rssbMedical: rssb.rssbMedical,
    cbhi,
    otherDeductions: input.otherDeductions,
    totalDeductions,
  };

  const employerCosts: EmployerCosts = {
    rssbEmployer: rssb.rssbEmployer,
    maternityLevy,
  };

  return {
    basicSalary: input.basicSalary,
    housingAllowance: input.housingAllowance,
    transportAllowance: input.transportAllowance,
    otherAllowances: input.otherAllowances,
    grossPay,
    paye,
    rssbEmployee: rssb.rssbEmployee,
    rssbEmployer: rssb.rssbEmployer,
    rssbMedical: rssb.rssbMedical,
    cbhi,
    maternityLevy,
    otherDeductions: input.otherDeductions,
    totalDeductions,
    netPay,
    employeeDeductions,
    employerCosts,
  };
}
