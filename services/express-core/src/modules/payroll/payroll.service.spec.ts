import { calculateEmployeePayroll, DEFAULT_RWANDA_TAX_BANDS } from './payroll.service';

describe('Rwanda Statutory Payroll Calculations', () => {
  
  test('Income below 60,000 RWF (0% progressive PAYE)', () => {
    const result = calculateEmployeePayroll({
      basicSalary: 50000,
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      otherDeductions: 0
    });

    expect(result.grossPay).toBe(50000);
    expect(result.paye).toBe(0);
    expect(result.rssbPensionEmployee).toBe(2500); // 5%
    expect(result.cbhiRama).toBe(250);            // 0.5%
    expect(result.totalDeductions).toBe(2750);
    expect(result.netPay).toBe(47250);
  });

  test('Income within the second progressive band: 80,000 RWF (10% band)', () => {
    const result = calculateEmployeePayroll({
      basicSalary: 70000,
      housingAllowance: 10000, // Gross: 80,000
      transportAllowance: 0,
      otherAllowances: 0,
      otherDeductions: 0
    });

    // PAYE: (80,000 - 60,000) * 10% = 2,000
    expect(result.grossPay).toBe(80000);
    expect(result.paye).toBe(2000);
    expect(result.rssbPensionEmployee).toBe(4000); // 5%
    expect(result.cbhiRama).toBe(400);            // 0.5%
    expect(result.totalDeductions).toBe(6400);
    expect(result.netPay).toBe(73600);
  });

  test('Income within the third progressive band: 500,000 RWF (20% band)', () => {
    const result = calculateEmployeePayroll({
      basicSalary: 400000,
      housingAllowance: 50000,
      transportAllowance: 30000,
      otherAllowances: 20000, // Gross: 500,000
      otherDeductions: 0
    });

    // PAYE:
    // Band 1 (up to 60k): 0
    // Band 2 (60k-100k): (100k - 60k) * 10% = 4,000
    // Band 3 (100k-500k): (500k - 100k) * 20% = 80,000
    // Total PAYE = 84,000
    expect(result.grossPay).toBe(500000);
    expect(result.paye).toBe(84000);
    expect(result.rssbPensionEmployee).toBe(25000); // 5%
    expect(result.cbhiRama).toBe(2500);            // 0.5%
    expect(result.totalDeductions).toBe(111500);
    expect(result.netPay).toBe(388500);
  });

  test('Income within the fourth progressive band: 2,000,000 RWF (30% band)', () => {
    const result = calculateEmployeePayroll({
      basicSalary: 1800000,
      housingAllowance: 100000,
      transportAllowance: 50000,
      otherAllowances: 50000, // Gross: 2,000,000
      otherDeductions: 0
    });

    // PAYE:
    // Band 1: 0
    // Band 2: 40,000 * 10% = 4,000
    // Band 3: 900,000 * 20% = 180,000
    // Band 4: (2,000,000 - 1,000,000) * 30% = 300,000
    // Total PAYE = 484,000
    expect(result.grossPay).toBe(2000000);
    expect(result.paye).toBe(484000);
    expect(result.rssbPensionEmployee).toBe(100000); // 5%
    expect(result.cbhiRama).toBe(10000);            // 0.5%
    expect(result.totalDeductions).toBe(594000);
    expect(result.netPay).toBe(1406000);
  });
});
