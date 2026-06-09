import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

type PayslipRecord = {
  id: string;
  basicSalary: unknown;
  housingAllowance: unknown;
  transportAllowance: unknown;
  otherAllowances: unknown;
  grossPay: unknown;
  paye: unknown;
  rssbEmployee: unknown;
  rssbMedical: unknown;
  cbhi: unknown;
  maternityLevy: unknown;
  rssbEmployer: unknown;
  otherDeductions: unknown;
  totalDeductions: unknown;
  netPay: unknown;
  payslipS3Key?: string | null;
};

@Injectable()
export class PayslipService {
  constructor(private readonly prisma: PrismaService) {}

  generatePayslipText(
    record: PayslipRecord,
    employee: { firstName: string; lastName: string; jobTitle?: string },
    period: { periodMonth: number; periodYear: number },
  ) {
    const fmt = (v: unknown) => Number(v).toLocaleString('en-RW');
    const employerTotal = Number(record.rssbEmployer) + Number(record.maternityLevy);
    return `============================================
E-Watu Payroll — HC Solutions Ltd
============================================
Employee: ${employee.firstName} ${employee.lastName}
Job Title: ${employee.jobTitle ?? '—'}
Period: ${period.periodMonth}/${period.periodYear}
============================================
EARNINGS
Basic Salary:          ${fmt(record.basicSalary)}
Housing Allowance:     ${fmt(record.housingAllowance)}
Transport Allowance:   ${fmt(record.transportAllowance)}
Other Allowances:      ${fmt(record.otherAllowances)}
GROSS PAY:             ${fmt(record.grossPay)}
============================================
EMPLOYEE DEDUCTIONS
PAYE:                  ${fmt(record.paye)}
RSSB Pension (5%):     ${fmt(record.rssbEmployee)}
RSSB Medical (7.5%):   ${fmt(record.rssbMedical)}
CBHI (0.5%):           ${fmt(record.cbhi)}
Other Deductions:      ${fmt(record.otherDeductions)}
TOTAL DEDUCTIONS:      ${fmt(record.totalDeductions)}
============================================
NET PAY:               ${fmt(record.netPay)}
============================================
EMPLOYER CONTRIBUTIONS (informational only)
RSSB Pension (Employer): ${fmt(record.rssbEmployer)}
Maternity Levy (Employer): ${fmt(record.maternityLevy)}
Total Employer Cost:     ${fmt(employerTotal)}
============================================
Note: Employer contributions are shown for information only
and do not affect your net pay.
============================================`;
  }

  async generatePayslipPdfBuffer(
    record: PayslipRecord,
    employee: { firstName: string; lastName: string; jobTitle: string; id: string },
    period: { periodMonth: number; periodYear: number },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (v: unknown) => Number(v).toLocaleString('en-RW');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const periodLabel = `${monthNames[period.periodMonth - 1] ?? period.periodMonth} ${period.periodYear}`;

      doc.fontSize(18).text('E-Watu Payroll — HC Solutions Ltd', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Pay Period: ${periodLabel}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(11).text(`Employee: ${employee.firstName} ${employee.lastName}`);
      doc.text(`Job Title: ${employee.jobTitle}`);
      doc.text(`Employee Code: ${employee.id.slice(0, 8).toUpperCase()}`);
      doc.moveDown();

      doc.fontSize(13).text('EARNINGS', { underline: true });
      doc.fontSize(11);
      doc.text(`Basic Salary:          ${fmt(record.basicSalary)} RWF`);
      doc.text(`Housing Allowance:     ${fmt(record.housingAllowance)} RWF`);
      doc.text(`Transport Allowance:   ${fmt(record.transportAllowance)} RWF`);
      doc.text(`Other Allowances:      ${fmt(record.otherAllowances)} RWF`);
      doc.font('Helvetica-Bold').text(`GROSS PAY:             ${fmt(record.grossPay)} RWF`);
      doc.font('Helvetica');
      doc.moveDown();

      doc.fontSize(13).text('EMPLOYEE DEDUCTIONS', { underline: true });
      doc.fontSize(11);
      doc.text(`PAYE:                  ${fmt(record.paye)} RWF`);
      doc.text(`RSSB Pension (5%):     ${fmt(record.rssbEmployee)} RWF`);
      doc.text(`RSSB Medical (7.5%):   ${fmt(record.rssbMedical)} RWF`);
      doc.text(`CBHI (0.5%):           ${fmt(record.cbhi)} RWF`);
      doc.text(`Other Deductions:      ${fmt(record.otherDeductions)} RWF`);
      doc.font('Helvetica-Bold').text(`TOTAL DEDUCTIONS:      ${fmt(record.totalDeductions)} RWF`);
      doc.font('Helvetica');
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text(`NET PAY: ${fmt(record.netPay)} RWF`, { align: 'center' });
      doc.font('Helvetica').moveDown();

      doc.fontSize(13).text('EMPLOYER CONTRIBUTIONS (informational)', { underline: true });
      doc.fontSize(10);
      doc.text(`RSSB Pension (Employer): ${fmt(record.rssbEmployer)} RWF`);
      doc.text(`Maternity Levy (Employer): ${fmt(record.maternityLevy)} RWF`);
      doc.text(`Total Employer Cost: ${fmt(Number(record.rssbEmployer) + Number(record.maternityLevy))} RWF`);
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#555555').text(
        'Employer contributions are shown for information only and do not affect your net pay.',
      );
      doc.fillColor('#000000');

      doc.end();
    });
  }

  async generateAndUploadPayslip(
    tenantId: string,
    recordId: string,
    periodId: string,
    employee: { id: string; firstName: string; lastName: string; jobTitle: string; email: string },
    record: PayslipRecord,
    period: { periodMonth: number; periodYear: number },
  ): Promise<string> {
    const objectKey = `payslips/${tenantId}/${periodId}/${employee.id}.pdf`;
    const pdfBuffer = await this.generatePayslipPdfBuffer(record, employee, period);
    const presign = await this.requestPresign(objectKey);
    await this.uploadToPresignedUrl(presign.url, pdfBuffer, 'application/pdf');

    await this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { payslipS3Key: objectKey, payslipGeneratedAt: new Date() },
    });

    return objectKey;
  }

  async getEmployeePayslips(tenantId: string, employeeId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, employeeId, payslipGeneratedAt: { not: null } },
      include: { employee: true, period: true },
      orderBy: [{ period: { periodYear: 'desc' } }, { period: { periodMonth: 'desc' } }],
    });

    return Promise.all(
      records.map(async (record) => ({
        periodId: record.periodId,
        periodMonth: record.period.periodMonth,
        periodYear: record.period.periodYear,
        netPay: record.netPay,
        downloadUrl: record.payslipS3Key
          ? (await this.requestPresign(record.payslipS3Key)).url
          : null,
        payslipText: this.generatePayslipText(record, record.employee, record.period),
      })),
    );
  }

  async getPeriodPayslips(tenantId: string, periodId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, periodId, payslipS3Key: { not: null } },
      include: { employee: true, period: true },
      orderBy: { employee: { firstName: 'asc' } },
    });

    return Promise.all(
      records.map(async (record) => ({
        employeeId: record.employeeId,
        employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
        downloadUrl: record.payslipS3Key
          ? (await this.requestPresign(record.payslipS3Key)).url
          : null,
        payslipText: this.generatePayslipText(record, record.employee, record.period),
      })),
    );
  }

  private async requestPresign(objectKey: string, expiresIn = 3600): Promise<{ url: string; objectKey: string }> {
    const base = (process.env.DOCUMENT_SERVICE_URL ?? 'http://document-service:3018').replace(/\/$/, '');
    const key = process.env.INTERNAL_API_KEY;
    if (!key) throw new ServiceUnavailableException('Document service not configured');

    const response = await fetch(`${base}/api/v1/document/internal/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': key,
      },
      body: JSON.stringify({ objectKey, expiresIn }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Failed to obtain presigned URL from document service');
    }

    return response.json() as Promise<{ url: string; objectKey: string }>;
  }

  private async uploadToPresignedUrl(url: string, body: Buffer, contentType: string): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: new Uint8Array(body),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Failed to upload payslip to storage');
    }
  }
}
