import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { calculatePayroll } from '../calculation/payroll.calculator';
import { dispatchNotification } from '../common/notification.dispatch';
import { PayslipService } from '../payslip/payslip.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovePeriodDto } from './dto/approve-period.dto';
import { CreatePeriodDto } from './dto/create-period.dto';

@Injectable()
export class PeriodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payslipService: PayslipService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreatePeriodDto) {
    const existing = await this.prisma.payrollPeriod.findFirst({
      where: { tenantId, clientId: dto.clientId, periodMonth: dto.periodMonth, periodYear: dto.periodYear },
    });
    if (existing) throw new ConflictException('Payroll period already exists');
    return this.prisma.payrollPeriod.create({
      data: { ...dto, tenantId, preparedBy: userId, status: 'DRAFT' },
    });
  }

  findAll(tenantId: string, query: Record<string, string | undefined>) {
    return this.prisma.payrollPeriod.findMany({
      where: {
        tenantId,
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.status ? { status: query.status as any } : {}),
        ...(query.periodYear ? { periodYear: Number.parseInt(query.periodYear, 10) } : {}),
      },
      include: { _count: { select: { records: true } } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id, tenantId },
      include: {
        records: { include: { employee: { select: { firstName: true, lastName: true } } } },
        approvals: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!period) throw new NotFoundException('Payroll period not found');
    const totals = period.records.reduce(
      (acc, rec) => ({
        gross: acc.gross + Number(rec.grossPay),
        net: acc.net + Number(rec.netPay),
        deductions: acc.deductions + Number(rec.totalDeductions),
      }),
      { gross: 0, net: 0, deductions: 0 },
    );
    return { ...period, totals };
  }

  async runPayroll(tenantId: string, periodId: string) {
    const period = await this.prisma.payrollPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status !== 'DRAFT') throw new BadRequestException('Only draft periods can be run');
    const config = await this.prisma.payrollConfiguration.findFirst({
      where: { tenantId, clientId: period.clientId },
    });
    if (!config) {
      throw new BadRequestException(
        'No payroll configuration found for this client. Please set up payroll configuration first.',
      );
    }
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, clientId: period.clientId, employmentStatus: 'ACTIVE' },
    });
    for (const employee of employees) {
      const result = calculatePayroll(
        {
          basicSalary: Number(employee.basicSalary),
          housingAllowance: Number(employee.housingAllowance),
          transportAllowance: Number(employee.transportAllowance),
          otherAllowances: Number(employee.otherAllowances),
          otherDeductions: 0,
        },
        {
          payeEnabled: config.payeEnabled,
          rssbPensionEmployee: Number(config.rssbPensionEmployee),
          rssbPensionEmployer: Number(config.rssbPensionEmployer),
          rssbMedical: Number(config.rssbMedical),
          cbhiRate: Number(config.cbhiRate),
          maternityLevy: Number(config.maternityLevy),
        },
      );

      const { employeeDeductions: _ed, employerCosts: _ec, ...recordFields } = result;

      await this.prisma.payrollRecord.upsert({
        where: { periodId_employeeId: { periodId: period.id, employeeId: employee.id } },
        create: { tenantId, periodId: period.id, employeeId: employee.id, ...recordFields },
        update: recordFields,
      });
    }
    return this.findOne(tenantId, periodId);
  }

  async submit(tenantId: string, periodId: string) {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: periodId, tenantId },
      include: { _count: { select: { records: true } } },
    });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status !== 'DRAFT') throw new BadRequestException('Only draft periods can be submitted');
    if (period._count.records < 1) throw new BadRequestException('No payroll records found for this period');

    const updated = await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
    void dispatchNotification('payroll-submitted', {
      periodId: updated.id,
      clientId: updated.clientId,
      tenantId,
      month: updated.periodMonth,
      year: updated.periodYear,
    });
    return updated;
  }

  async approve(tenantId: string, periodId: string, userId: string, userRole: string, dto: ApprovePeriodDto) {
    const period = await this.prisma.payrollPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    let statusUpdate: Record<string, unknown> = {};
    let approverRole: 'HR_MANAGER' | 'MD' | 'CLIENT_ADMIN';
    let notifyType = '';

    if (userRole === 'HR_MANAGER' && period.status === 'SUBMITTED') {
      statusUpdate = { status: 'HR_APPROVED', hrApprovedAt: new Date(), hrApprovedBy: userId };
      approverRole = 'HR_MANAGER';
      notifyType = 'payroll-hr-approved';
    } else if (userRole === 'TENANT_ADMIN' && period.status === 'HR_APPROVED') {
      statusUpdate = { status: 'MD_APPROVED', mdApprovedAt: new Date(), mdApprovedBy: userId };
      approverRole = 'MD';
      notifyType = 'payroll-md-approved';
    } else if (userRole === 'CLIENT_ADMIN' && period.status === 'MD_APPROVED') {
      statusUpdate = { status: 'CLIENT_APPROVED', clientApprovedAt: new Date(), clientApprovedBy: userId };
      approverRole = 'CLIENT_ADMIN';
      notifyType = 'payroll-client-approved';
    } else {
      throw new ForbiddenException('Invalid approval role for current period status');
    }

    const updated = await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: statusUpdate });
    await this.prisma.payrollApproval.create({
      data: {
        tenantId,
        periodId,
        approverRole,
        approverId: userId,
        action: 'APPROVED',
        comments: dto.comments,
      },
    });
    void dispatchNotification(notifyType, { tenantId, periodId, comments: dto.comments });
    return updated;
  }

  async reject(tenantId: string, periodId: string, userId: string, userRole: string, dto: ApprovePeriodDto) {
    const period = await this.prisma.payrollPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (!['HR_MANAGER', 'TENANT_ADMIN', 'CLIENT_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('User role cannot reject this period');
    }
    if (!['SUBMITTED', 'HR_APPROVED', 'MD_APPROVED', 'CLIENT_APPROVED'].includes(period.status)) {
      throw new BadRequestException('Period cannot be rejected at this stage');
    }
    const role = userRole === 'TENANT_ADMIN' ? 'MD' : (userRole as 'HR_MANAGER' | 'CLIENT_ADMIN');
    const updated = await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'DRAFT' },
    });
    await this.prisma.payrollApproval.create({
      data: {
        tenantId,
        periodId,
        approverRole: role,
        approverId: userId,
        action: 'REJECTED',
        comments: dto.comments,
      },
    });
    void dispatchNotification('payroll-rejected', { tenantId, periodId, comments: dto.comments });
    return updated;
  }

  async finalize(tenantId: string, periodId: string, userId: string) {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: periodId, tenantId },
      include: { records: { include: { employee: true } } },
    });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status !== 'CLIENT_APPROVED') {
      throw new BadRequestException('Only client-approved periods can be finalized');
    }
    const finalized = await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'FINALIZED', finalizedAt: new Date() },
    });

    for (const record of period.records) {
      await this.payslipService.generateAndUploadPayslip(
        tenantId,
        record.id,
        periodId,
        {
          id: record.employee.id,
          firstName: record.employee.firstName,
          lastName: record.employee.lastName,
          jobTitle: record.employee.jobTitle,
          email: record.employee.email,
        },
        record,
        { periodMonth: period.periodMonth, periodYear: period.periodYear },
      );

      void dispatchNotification('payslip-ready', {
        employeeId: record.employeeId,
        employeeEmail: record.employee.email,
        periodId,
        tenantId,
      });
    }

    const totalAmount = period.records.reduce((sum, rec) => sum + Number(rec.netPay), 0);
    await this.prisma.bankPaymentFile.create({
      data: {
        tenantId,
        periodId,
        generatedBy: userId,
        totalAmount,
        recordCount: period.records.length,
      },
    });
    void dispatchNotification('payroll-finalized', {
      periodId,
      tenantId,
      recordCount: period.records.length,
    });
    return finalized;
  }
}
