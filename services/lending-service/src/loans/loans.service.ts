import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log.service';
import { generateRepaymentSchedule } from '../calculation/loan-schedule.calculator';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { WriteOffLoanDto } from './dto/write-off-loan.dto';
import { AddCollateralDto } from './dto/add-collateral.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateLoanDto) {
    const loan = await this.prisma.loan.create({
      data: {
        tenantId,
        borrowerId: dto.borrowerId,
        principalAmount: dto.principalAmount,
        interestRate: dto.interestRate,
        interestType: dto.interestType,
        termMonths: dto.termMonths,
        purpose: dto.purpose ?? null,
        requestedBy: userId,
        status: 'DRAFT',
      },
    });

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'CREATE_LOAN',
      resource: 'loans',
      resourceId: loan.id,
      payload: { borrowerId: dto.borrowerId, principalAmount: dto.principalAmount },
    });

    return loan;
  }

  async findAll(tenantId: string, filters: { status?: string; borrowerId?: string } = {}) {
    return this.prisma.loan.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.borrowerId ? { borrowerId: filters.borrowerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, tenantId },
      include: {
        collaterals: true,
        schedule: { orderBy: { installmentNumber: 'asc' } },
        repayments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  async getSchedule(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.repaymentSchedule.findMany({
      where: { loanId: id, tenantId },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  async addCollateral(tenantId: string, userId: string, loanId: string, dto: AddCollateralDto) {
    const loan = await this.findOne(tenantId, loanId);
    if (loan.status === 'CLOSED' || loan.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Cannot modify a closed or written-off loan');
    }

    const collateral = await this.prisma.loanCollateral.create({
      data: { tenantId, loanId, description: dto.description, estimatedValue: dto.estimatedValue },
    });

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'ADD_COLLATERAL',
      resource: 'loans',
      resourceId: loanId,
      payload: { description: dto.description, estimatedValue: dto.estimatedValue },
    });

    return collateral;
  }

  async submit(tenantId: string, userId: string, id: string) {
    const loan = await this.findOne(tenantId, id);
    if (loan.status !== 'DRAFT') {
      throw new BadRequestException('Only draft loans can be submitted');
    }

    const updated = await this.prisma.loan.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'SUBMIT_LOAN',
      resource: 'loans',
      resourceId: id,
      payload: {},
    });

    return updated;
  }

  async approve(tenantId: string, userId: string, id: string) {
    const loan = await this.findOne(tenantId, id);
    if (loan.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted loans can be approved');
    }

    const updated = await this.prisma.loan.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'APPROVE_LOAN',
      resource: 'loans',
      resourceId: id,
      payload: {},
    });

    return updated;
  }

  async reject(tenantId: string, userId: string, id: string, dto: RejectLoanDto) {
    const loan = await this.findOne(tenantId, id);
    if (loan.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted loans can be rejected');
    }

    const updated = await this.prisma.loan.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: dto.reason },
    });

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'REJECT_LOAN',
      resource: 'loans',
      resourceId: id,
      payload: { reason: dto.reason },
    });

    return updated;
  }

  async disburse(tenantId: string, userId: string, id: string) {
    const loan = await this.findOne(tenantId, id);
    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Only approved loans can be disbursed');
    }

    const disbursedAt = new Date();
    const installments = generateRepaymentSchedule({
      principal: Number(loan.principalAmount),
      annualRatePercent: Number(loan.interestRate),
      termMonths: loan.termMonths,
      interestType: loan.interestType as 'FLAT' | 'REDUCING_BALANCE',
      startDate: disbursedAt,
    });

    const [, updated] = await this.prisma.$transaction([
      this.prisma.repaymentSchedule.createMany({
        data: installments.map((row) => ({
          tenantId,
          loanId: id,
          installmentNumber: row.installmentNumber,
          dueDate: row.dueDate,
          principalDue: row.principalDue,
          interestDue: row.interestDue,
          totalDue: row.totalDue,
        })),
      }),
      this.prisma.loan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          disbursedAt,
          disbursedAmount: loan.principalAmount,
        },
      }),
    ]);

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'DISBURSE_LOAN',
      resource: 'loans',
      resourceId: id,
      payload: { installments: installments.length },
    });

    return updated;
  }

  async recordRepayment(tenantId: string, userId: string, loanId: string, dto: RecordRepaymentDto) {
    const loan = await this.findOne(tenantId, loanId);
    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException('Repayments can only be recorded on active loans');
    }

    const targetSchedule = dto.scheduleId
      ? loan.schedule.find((s) => s.id === dto.scheduleId)
      : loan.schedule.find((s) => s.status !== 'PAID');

    if (!targetSchedule) {
      throw new BadRequestException('No outstanding installment to apply this repayment to');
    }

    const newAmountPaid = Number(targetSchedule.amountPaid) + dto.amount;
    const scheduleStatus = newAmountPaid >= Number(targetSchedule.totalDue) ? 'PAID' : 'PARTIAL';

    const [repayment] = await this.prisma.$transaction([
      this.prisma.loanRepayment.create({
        data: {
          tenantId,
          loanId,
          scheduleId: targetSchedule.id,
          amount: dto.amount,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          method: dto.method ?? null,
          recordedBy: userId,
        },
      }),
      this.prisma.repaymentSchedule.update({
        where: { id: targetSchedule.id },
        data: { amountPaid: newAmountPaid, status: scheduleStatus },
      }),
    ]);

    const remainingSchedule = await this.prisma.repaymentSchedule.findMany({ where: { loanId } });
    const allPaid = remainingSchedule.every((s) =>
      s.id === targetSchedule.id ? scheduleStatus === 'PAID' : s.status === 'PAID',
    );
    if (allPaid) {
      await this.prisma.loan.update({ where: { id: loanId }, data: { status: 'CLOSED', closedAt: new Date() } });
    }

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'RECORD_REPAYMENT',
      resource: 'loans',
      resourceId: loanId,
      payload: { amount: dto.amount, scheduleId: targetSchedule.id },
    });

    return repayment;
  }

  async writeOff(tenantId: string, userId: string, id: string, dto: WriteOffLoanDto) {
    const loan = await this.findOne(tenantId, id);
    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException('Only active loans can be written off');
    }

    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        status: 'WRITTEN_OFF',
        writeOffAmount: dto.amount,
        writeOffReason: dto.reason,
        writtenOffAt: new Date(),
      },
    });

    void this.auditLog.record({
      tenantId,
      userId,
      action: 'WRITE_OFF_LOAN',
      resource: 'loans',
      resourceId: id,
      payload: { amount: dto.amount, reason: dto.reason },
    });

    return updated;
  }
}
