import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayslipService {
  constructor(private readonly prisma: PrismaService) {}

  generatePayslipText(
    record: Record<string, unknown>,
    employee: { firstName: string; lastName: string },
    period: { periodMonth: number; periodYear: number },
  ) {
    return `============================================
E-Watu Payroll — HC Solutions Ltd
============================================
Employee: ${employee.firstName} ${employee.lastName}
Period: ${period.periodMonth}/${period.periodYear}
============================================
EARNINGS
Basic Salary:          ${record.basicSalary}
Housing Allowance:     ${record.housingAllowance}
Transport Allowance:   ${record.transportAllowance}
Other Allowances:      ${record.otherAllowances}
GROSS PAY:             ${record.grossPay}
============================================
DEDUCTIONS
PAYE:                  ${record.paye}
RSSB (Employee 5%):    ${record.rssbEmployee}
RSSB Medical (7.5%):   ${record.rssbMedical}
CBHI (0.5%):           ${record.cbhi}
Maternity Levy (0.3%): ${record.maternityLevy}
Other Deductions:      ${record.otherDeductions}
TOTAL DEDUCTIONS:      ${record.totalDeductions}
============================================
NET PAY:               ${record.netPay}
============================================
Employer RSSB (5%):    ${record.rssbEmployer}
============================================`;
  }

  async getEmployeePayslips(tenantId: string, employeeId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, employeeId, payslipGeneratedAt: { not: null } },
      include: { employee: true, period: true },
      orderBy: [{ period: { periodYear: 'desc' } }, { period: { periodMonth: 'desc' } }],
    });
    return records.map((record) => ({
      id: record.id,
      periodMonth: record.period.periodMonth,
      periodYear: record.period.periodYear,
      netPay: record.netPay,
      payslipText: this.generatePayslipText(record, record.employee, record.period),
    }));
  }

  async getPeriodPayslips(tenantId: string, periodId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, periodId },
      include: { employee: true, period: true },
      orderBy: { employee: { firstName: 'asc' } },
    });
    return records.map((record) => ({
      id: record.id,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      netPay: record.netPay,
      payslipText: this.generatePayslipText(record, record.employee, record.period),
    }));
  }
}
