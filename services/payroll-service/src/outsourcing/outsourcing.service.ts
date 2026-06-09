import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateContractDto,
  UpdateContractDto,
  TerminateContractDto,
  RenewContractDto,
  DeploymentStatus,
  SecondmentContractStatus,
} from './dtos/outsourcing.dto';

@Injectable()
export class OutsourcingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Assignments / Registry ──────────────────────────────────────

  async findAllAssignments(
    tenantId: string,
    query: Record<string, string | undefined>,
  ) {
    const { clientName, status, role, employmentType } = query;
    const where: any = { tenantId };
    if (clientName) where.clientName = { contains: clientName, mode: 'insensitive' };
    if (status && status !== 'ALL') where.deploymentStatus = status;
    if (role) where.roleName = { contains: role, mode: 'insensitive' };
    if (employmentType && employmentType !== 'ALL') where.employmentType = employmentType;

    return this.prisma.outsourcingAssignment.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true } },
        contracts: {
          where: { status: 'ACTIVE' },
          select: { id: true, endDate: true, billingRate: true, currency: true, status: true, alert30Sent: true, alert60Sent: true, alert90Sent: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBench(tenantId: string) {
    return this.prisma.outsourcingAssignment.findMany({
      where: { tenantId, deploymentStatus: 'ON_BENCH' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true } },
      },
      orderBy: { availabilityDate: 'asc' },
    });
  }

  async createAssignment(tenantId: string, userId: string, dto: CreateAssignmentDto) {
    const assignment = await this.prisma.outsourcingAssignment.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        clientName: dto.clientName,
        clientId: dto.clientId,
        roleName: dto.roleName,
        deploymentSite: dto.deploymentSite,
        employmentType: (dto.employmentType as any) ?? 'FULL_TIME',
        deploymentStatus: 'ACTIVE',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        monthlyFee: dto.monthlyFee,
        currency: dto.currency ?? 'RWF',
        noticePeriodDays: dto.noticePeriodDays ?? 30,
      },
    });

    // Record initial deployment history
    await this.prisma.deploymentHistory.create({
      data: {
        tenantId,
        assignmentId: assignment.id,
        clientName: dto.clientName,
        roleName: dto.roleName,
        startDate: new Date(dto.startDate),
        reason: 'Initial deployment',
      },
    });

    return assignment;
  }

  async updateAssignment(tenantId: string, userId: string, id: string, dto: UpdateAssignmentDto) {
    const existing = await this.prisma.outsourcingAssignment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Assignment not found');

    // If transferring to a new client, close current history and open a new one
    const isTransfer = dto.clientName && dto.clientName !== existing.clientName;
    if (isTransfer) {
      await this.prisma.deploymentHistory.updateMany({
        where: { assignmentId: id, endDate: null },
        data: { endDate: new Date(), reason: dto.transferReason ?? 'Transfer' },
      });
      await this.prisma.deploymentHistory.create({
        data: {
          tenantId,
          assignmentId: id,
          clientName: dto.clientName!,
          roleName: dto.roleName ?? existing.roleName,
          startDate: new Date(),
          reason: dto.transferReason ?? 'Transfer',
        },
      });
    }

    const statusChanged =
      dto.deploymentStatus && dto.deploymentStatus !== existing.deploymentStatus && !isTransfer;
    if (statusChanged) {
      await this.prisma.deploymentHistory.updateMany({
        where: { assignmentId: id, endDate: null },
        data: {
          endDate: new Date(),
          reason: dto.statusChangeReason ?? dto.deploymentStatus,
        },
      });
      await this.prisma.deploymentHistory.create({
        data: {
          tenantId,
          assignmentId: id,
          clientName: dto.clientName ?? existing.clientName,
          roleName: dto.roleName ?? existing.roleName,
          startDate: new Date(),
          reason: dto.statusChangeReason ?? dto.deploymentStatus,
        },
      });
    }

    return this.prisma.outsourcingAssignment.update({
      where: { id },
      data: {
        ...(dto.clientName && { clientName: dto.clientName }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId }),
        ...(dto.roleName && { roleName: dto.roleName }),
        ...(dto.deploymentSite !== undefined && { deploymentSite: dto.deploymentSite }),
        ...(dto.employmentType && { employmentType: dto.employmentType as any }),
        ...(dto.deploymentStatus && { deploymentStatus: dto.deploymentStatus as any }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.availabilityDate && { availabilityDate: new Date(dto.availabilityDate) }),
        ...(dto.monthlyFee !== undefined && { monthlyFee: dto.monthlyFee }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.noticePeriodDays !== undefined && { noticePeriodDays: dto.noticePeriodDays }),
      },
    });
  }

  async getDeploymentHistory(tenantId: string, assignmentId: string) {
    const assignment = await this.prisma.outsourcingAssignment.findFirst({ where: { id: assignmentId, tenantId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.prisma.deploymentHistory.findMany({
      where: { assignmentId },
      orderBy: { startDate: 'desc' },
    });
  }

  // ── Secondment Contracts ────────────────────────────────────────

  async findAllContracts(tenantId: string, query: Record<string, string | undefined>) {
    const { status, clientName } = query;
    const where: any = { tenantId };
    if (status && status !== 'ALL') where.status = status;
    if (clientName) where.clientName = { contains: clientName, mode: 'insensitive' };

    return this.prisma.secondmentContract.findMany({
      where,
      include: {
        assignment: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        amendments: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createContract(tenantId: string, userId: string, dto: CreateContractDto) {
    const assignment = await this.prisma.outsourcingAssignment.findFirst({ where: { id: dto.assignmentId, tenantId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.secondmentContract.create({
      data: {
        tenantId,
        assignmentId: dto.assignmentId,
        contractRef: dto.contractRef,
        clientName: dto.clientName,
        role: dto.role,
        billingRate: dto.billingRate,
        currency: dto.currency ?? 'RWF',
        workingHoursPerWeek: dto.workingHoursPerWeek ?? 40,
        noticePeriodDays: dto.noticePeriodDays ?? 30,
        governingLaw: dto.governingLaw,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
        status: 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  async updateContract(tenantId: string, userId: string, id: string, dto: UpdateContractDto) {
    const contract = await this.prisma.secondmentContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');

    // Capture snapshot for amendment log
    if (dto.amendmentReason) {
      await this.prisma.contractAmendment.create({
        data: {
          tenantId,
          contractId: id,
          changedBy: userId,
          reason: dto.amendmentReason,
          changesSummary: this.buildChangesSummary(contract, dto),
          snapshotJson: contract as any,
        },
      });
    }

    return this.prisma.secondmentContract.update({
      where: { id },
      data: {
        ...(dto.contractRef !== undefined && { contractRef: dto.contractRef }),
        ...(dto.role && { role: dto.role }),
        ...(dto.billingRate !== undefined && { billingRate: dto.billingRate }),
        ...(dto.workingHoursPerWeek !== undefined && { workingHoursPerWeek: dto.workingHoursPerWeek }),
        ...(dto.noticePeriodDays !== undefined && { noticePeriodDays: dto.noticePeriodDays }),
        ...(dto.governingLaw !== undefined && { governingLaw: dto.governingLaw }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.renewalDate && { renewalDate: new Date(dto.renewalDate) }),
      },
      include: { amendments: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async terminateContract(tenantId: string, userId: string, id: string, dto: TerminateContractDto) {
    const contract = await this.prisma.secondmentContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');

    await this.prisma.contractAmendment.create({
      data: {
        tenantId,
        contractId: id,
        changedBy: userId,
        reason: dto.reason,
        changesSummary: 'Contract terminated',
        snapshotJson: contract as any,
      },
    });

    const terminatedAt = dto.terminationDate ? new Date(dto.terminationDate) : new Date();
    return this.prisma.secondmentContract.update({
      where: { id },
      data: { status: 'TERMINATED', terminationReason: dto.reason, terminatedAt, terminatedBy: userId },
    });
  }

  async renewContract(tenantId: string, userId: string, id: string, dto: RenewContractDto) {
    const contract = await this.prisma.secondmentContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');

    // Mark old as RENEWED
    await this.prisma.secondmentContract.update({ where: { id }, data: { status: 'RENEWED' } });

    // Create amendment record
    await this.prisma.contractAmendment.create({
      data: {
        tenantId, contractId: id, changedBy: userId,
        reason: dto.notes ?? 'Contract renewed',
        changesSummary: `Renewed to ${dto.newEndDate}${dto.billingRate ? `, new rate: ${dto.billingRate}` : ''}`,
        snapshotJson: contract as any,
      },
    });

    // Create new active contract
    return this.prisma.secondmentContract.create({
      data: {
        tenantId,
        assignmentId: contract.assignmentId,
        contractRef: contract.contractRef ? `${contract.contractRef}-R` : undefined,
        clientName: contract.clientName,
        role: contract.role,
        billingRate: dto.billingRate ?? contract.billingRate,
        currency: contract.currency,
        workingHoursPerWeek: contract.workingHoursPerWeek,
        noticePeriodDays: contract.noticePeriodDays,
        governingLaw: contract.governingLaw,
        startDate: contract.endDate ?? new Date(),
        endDate: new Date(dto.newEndDate),
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
        status: 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  async getContractAmendments(tenantId: string, contractId: string) {
    const contract = await this.prisma.secondmentContract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.contractAmendment.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Billing ─────────────────────────────────────────────────────

  async getBillingSummary(tenantId: string, period: string) {
    const [yearStr = '0', monthStr = '0'] = period.split('-');
    const periodYear = parseInt(yearStr, 10);
    const periodMonth = parseInt(monthStr, 10);

    const startOfPeriod = new Date(periodYear, periodMonth - 1, 1);
    const endOfPeriod = new Date(periodYear, periodMonth, 1);

    const assignments = await this.prisma.outsourcingAssignment.findMany({
      where: {
        tenantId,
        deploymentStatus: { not: 'ON_BENCH' },
        startDate: { lt: endOfPeriod },
        OR: [{ endDate: null }, { endDate: { gte: startOfPeriod } }],
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const lines = assignments.map((a) => ({
      assignmentId: a.id,
      employeeId: a.employeeId,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
      clientName: a.clientName,
      clientId: a.clientId,
      roleName: a.roleName,
      deploymentSite: a.deploymentSite,
      billingRate: a.monthlyFee?.toString() ?? '0',
      currency: a.currency ?? 'RWF',
      period,
      periodYear,
      periodMonth,
    }));

    const totalsByCurrency: Record<string, number> = {};
    for (const line of lines) {
      const rate = parseFloat(line.billingRate);
      totalsByCurrency[line.currency] = (totalsByCurrency[line.currency] ?? 0) + rate;
    }

    // Group by client for invoice breakdown
    const byClient: Record<string, typeof lines> = {};
    for (const line of lines) {
      (byClient[line.clientName] ??= []).push(line);
    }

    return {
      period,
      periodYear,
      periodMonth,
      status: 'DRAFT',
      lineCount: lines.length,
      lines,
      byClient,
      totalsByCurrency: Object.fromEntries(
        Object.entries(totalsByCurrency).map(([k, v]) => [k, v.toFixed(2)]),
      ),
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private buildChangesSummary(contract: any, dto: UpdateContractDto): string {
    const changes: string[] = [];
    if (dto.billingRate !== undefined && dto.billingRate !== Number(contract.billingRate))
      changes.push(`Rate: ${contract.billingRate} → ${dto.billingRate}`);
    if (dto.endDate && dto.endDate !== contract.endDate?.toISOString().slice(0, 10))
      changes.push(`End date: ${contract.endDate?.toISOString().slice(0, 10) ?? 'none'} → ${dto.endDate}`);
    if (dto.role && dto.role !== contract.role)
      changes.push(`Role: ${contract.role} → ${dto.role}`);
    if (dto.noticePeriodDays !== undefined && dto.noticePeriodDays !== contract.noticePeriodDays)
      changes.push(`Notice: ${contract.noticePeriodDays}d → ${dto.noticePeriodDays}d`);
    return changes.length ? changes.join(', ') : 'Minor update';
  }
}
