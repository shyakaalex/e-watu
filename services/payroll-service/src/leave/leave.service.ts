import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Standard initialization if needed, but we seed defaults per tenant demand
  }

  // Ensures standard leave types exist for a tenant
  async ensureDefaultLeaveTypes(tenantId: string): Promise<void> {
    const defaults = [
      { name: 'Annual Leave', code: 'ANNUAL', defaultDays: 18 },
      { name: 'Sick Leave', code: 'SICK', defaultDays: 15 },
      { name: 'Maternity Leave', code: 'MATERNITY', defaultDays: 90 },
      { name: 'Paternity Leave', code: 'PATERNITY', defaultDays: 4 },
      { name: 'Unpaid Leave', code: 'UNPAID', defaultDays: 0 },
    ];

    for (const d of defaults) {
      const exists = await this.prisma.leaveType.findFirst({
        where: { tenantId, code: d.code },
      });
      if (!exists) {
        await this.prisma.leaveType.create({
          data: {
            tenantId,
            name: d.name,
            code: d.code,
            defaultDays: d.defaultDays,
          },
        });
      }
    }
  }

  async getLeaveTypes(tenantId: string) {
    await this.ensureDefaultLeaveTypes(tenantId);
    return this.prisma.leaveType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async getLeaveBalances(tenantId: string, employeeId: string, year: number) {
    // Ensure balances exist for all types
    const types = await this.getLeaveTypes(tenantId);
    const balances = [];
    for (const type of types) {
      const balance = await this.getOrInitializeBalance(tenantId, employeeId, type.id, year);
      balances.push({
        ...balance,
        leaveType: type,
      });
    }
    return balances;
  }

  async getOrInitializeBalance(tenantId: string, employeeId: string, leaveTypeId: string, year: number) {
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
      },
    });
    if (balance) return balance;

    const leaveType = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    return this.prisma.leaveBalance.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId,
        year,
        allocatedDays: leaveType.defaultDays,
        usedDays: 0,
      },
    });
  }

  async createLeaveRequest(
    tenantId: string,
    body: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      days?: number;
      reason?: string;
    },
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const calculatedDays = body.days ?? this.calculateWorkingDays(startDate, endDate);
    const year = startDate.getFullYear();

    // Check balance if not Unpaid Leave
    const leaveType = await this.prisma.leaveType.findUnique({ where: { id: body.leaveTypeId } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    if (leaveType.code !== 'UNPAID') {
      const balance = await this.getOrInitializeBalance(tenantId, body.employeeId, body.leaveTypeId, year);
      const remaining = Number(balance.allocatedDays) - Number(balance.usedDays);
      if (calculatedDays > remaining) {
        throw new BadRequestException(`Insufficient leave balance. Remaining: ${remaining} days, requested: ${calculatedDays} days.`);
      }
    }

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
        startDate,
        endDate,
        numberOfDays: calculatedDays,
        reason: body.reason,
        status: 'PENDING',
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });
  }

  async getLeaveRequests(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }
    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveLeaveRequest(tenantId: string, id: string, approvedById: string, note?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Leave request is already processed');
    }

    const year = request.startDate.getFullYear();

    // Deduct leave balance
    if (request.leaveType.code !== 'UNPAID') {
      const balance = await this.getOrInitializeBalance(
        tenantId,
        request.employeeId,
        request.leaveTypeId,
        year,
      );
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: Number(balance.usedDays) + Number(request.numberOfDays),
        },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
        reason: note ? `${request.reason ?? ''} (Note: ${note})` : request.reason,
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });
  }

  async rejectLeaveRequest(tenantId: string, id: string, approvedById: string, note?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Leave request is already processed');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById,
        approvedAt: new Date(),
        rejectionReason: note,
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    // Normalize time to avoid timezone issues
    curDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate.getTime());
    end.setHours(0, 0, 0, 0);

    while (curDate <= end) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }
}
