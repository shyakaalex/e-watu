import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePAYEReport(tenantId: string, periodId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, periodId },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (!records.length) throw new NotFoundException('No payroll records found');
    const rows = records.map(
      (r) => `${r.employee.firstName} ${r.employee.lastName},${Number(r.grossPay)},${Number(r.paye)}`,
    );
    return `Employee Name,Gross Pay,PAYE\n${rows.join('\n')}\n`;
  }

  async generateRSSBReport(tenantId: string, periodId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, periodId },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (!records.length) throw new NotFoundException('No payroll records found');
    const rows = records.map(
      (r) =>
        `${r.employee.firstName} ${r.employee.lastName},${Number(r.rssbEmployee)},${Number(r.rssbEmployer)},${Number(r.rssbMedical)}`,
    );
    return `Employee Name,RSSB Employee,RSSB Employer,RSSB Medical\n${rows.join('\n')}\n`;
  }

  async generateSummaryReport(tenantId: string, clientId: string, year: number) {
    const periods = await this.prisma.payrollPeriod.findMany({
      where: { tenantId, clientId, periodYear: year },
      include: { records: true },
      orderBy: { periodMonth: 'asc' },
    });
    return periods.map((period) => {
      const totals = period.records.reduce(
        (acc, rec) => ({
          totalGross: acc.totalGross + Number(rec.grossPay),
          totalNet: acc.totalNet + Number(rec.netPay),
          totalPAYE: acc.totalPAYE + Number(rec.paye),
          totalRSSB: acc.totalRSSB + Number(rec.rssbEmployee) + Number(rec.rssbEmployer) + Number(rec.rssbMedical),
        }),
        { totalGross: 0, totalNet: 0, totalPAYE: 0, totalRSSB: 0 },
      );
      return {
        month: period.periodMonth,
        year: period.periodYear,
        ...totals,
        employeeCount: period.records.length,
      };
    });
  }

  async generateBankFile(tenantId: string, periodId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, periodId },
      include: {
        employee: { select: { firstName: true, lastName: true, bankName: true, bankBranch: true, bankAccountEncrypted: true } },
      },
    });
    if (!records.length) throw new NotFoundException('No payroll records found');
    const rows = records.map((r) => {
      const account = r.employee.bankAccountEncrypted
        ? Buffer.from(r.employee.bankAccountEncrypted, 'base64').toString('utf8')
        : '';
      return `${r.employee.firstName} ${r.employee.lastName},${r.employee.bankName ?? ''},${r.employee.bankBranch ?? ''},${account},${Number(r.netPay)}`;
    });
    return `Employee Name,Bank,Branch,Account,Net Pay\n${rows.join('\n')}\n`;
  }
}
