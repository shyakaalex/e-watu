import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/audit-log.service';
import { dispatchNotification } from '../common/notification.dispatch';

const MANAGER_ROLES = ['TENANT_ADMIN', 'HR_MANAGER'];

@Injectable()
export class LeaveService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async onModuleInit() {
    // Standard initialization if needed, but we seed defaults per tenant demand
  }

  // Ensures standard leave types exist for a tenant
  async ensureDefaultLeaveTypes(tenantId: string): Promise<void> {
    const defaults = [
      { name: 'Annual Leave', code: 'ANNUAL', defaultDays: 22 },
      { name: 'Sick Leave', code: 'SICK', defaultDays: 10 },
      { name: 'Maternity Leave', code: 'MATERNITY', defaultDays: 90 },
      { name: 'Paternity Leave', code: 'PATERNITY', defaultDays: 4 },
      { name: 'Compassionate Leave', code: 'COMPASSIONATE', defaultDays: 5 },
      { name: 'Study Leave', code: 'STUDY', defaultDays: 10 },
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

  /** Resolves the JWT caller to their linked Employee record, matching by email (same approach the frontend already uses). */
  async findEmployeeForUser(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
  }

  private async assertCanActOnRequest(
    tenantId: string,
    request: { employeeId: string; employee: { managerId: string | null } },
    caller: { userId: string; roles: string[]; email?: string },
  ): Promise<void> {
    if (MANAGER_ROLES.some((r) => caller.roles.includes(r))) return;

    const callerEmployee = await this.findEmployeeForUser(tenantId, caller.email);
    if (callerEmployee && request.employee.managerId === callerEmployee.id) return;

    throw new ForbiddenException('You are not authorized to act on this leave request');
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
      attachmentS3Key?: string;
      delegateToEmployeeId?: string;
      emergencyContactPhone?: string;
    },
    actor: { userId: string; ip?: string },
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const calculatedDays = body.days ?? this.calculateWorkingDays(startDate, endDate);
    const year = startDate.getFullYear();

    const leaveType = await this.prisma.leaveType.findUnique({ where: { id: body.leaveTypeId } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // Overlap check — an employee cannot have two pending/approved requests covering the same dates
    const overlapping = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: body.employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    const conflict = overlapping[0];
    if (conflict) {
      throw new BadRequestException(
        `This overlaps an existing leave request from ${conflict.startDate.toDateString()} to ${conflict.endDate.toDateString()}.`,
      );
    }

    // Check balance if not Unpaid Leave
    if (leaveType.code !== 'UNPAID') {
      const balance = await this.getOrInitializeBalance(tenantId, body.employeeId, body.leaveTypeId, year);
      const remaining = Number(balance.allocatedDays) - Number(balance.usedDays);
      if (calculatedDays > remaining) {
        throw new BadRequestException(`Insufficient leave balance. Remaining: ${remaining} days, requested: ${calculatedDays} days.`);
      }
    }

    const request = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
        startDate,
        endDate,
        numberOfDays: calculatedDays,
        reason: body.reason,
        attachmentS3Key: body.attachmentS3Key,
        delegateToEmployeeId: body.delegateToEmployeeId,
        emergencyContactPhone: body.emergencyContactPhone,
        status: 'PENDING',
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });

    void this.auditLog.record({
      tenantId,
      userId: actor.userId,
      action: 'SUBMITTED',
      resource: 'leave_request',
      resourceId: request.id,
      payload: { leaveType: leaveType.code, startDate: body.startDate, endDate: body.endDate },
      ipAddress: actor.ip,
    });
    void dispatchNotification('leave-submitted', {
      tenantId,
      leaveRequestId: request.id,
      employeeId: request.employeeId,
      employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
      leaveType: leaveType.name,
    });

    return request;
  }

  async getLeaveRequests(
    tenantId: string,
    filters: {
      status?: string;
      employeeId?: string;
      department?: string;
      leaveTypeId?: string;
      managerId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.startDate) where.startDate = { ...(where.startDate ?? {}), gte: new Date(filters.startDate) };
    if (filters.endDate) where.endDate = { ...(where.endDate ?? {}), lte: new Date(filters.endDate) };

    const employeeFilter: any = {};
    if (filters.department) employeeFilter.department = filters.department;
    if (filters.managerId) employeeFilter.managerId = filters.managerId;
    if (filters.search) {
      employeeFilter.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(employeeFilter).length > 0) {
      where.employee = employeeFilter;
    }

    const requests = await this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: true,
        delegateTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({ ...r, attachmentUrl: this.buildAttachmentUrl(r.attachmentS3Key) }));
  }

  private buildAttachmentUrl(s3Key: string | null): string | null {
    if (!s3Key) return null;
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    const bucket = process.env.S3_BUCKET;
    if (!endpoint || !bucket) return null;
    return `${endpoint}/${bucket}/${s3Key}`;
  }

  async approveLeaveRequest(
    tenantId: string,
    id: string,
    actor: { userId: string; roles: string[]; email?: string; ip?: string },
    note?: string,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true, employee: true },
    });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Leave request not found');
    }
    await this.assertCanActOnRequest(tenantId, request, actor);
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

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: actor.userId,
        approvedAt: new Date(),
        reason: note ? `${request.reason ?? ''} (Note: ${note})` : request.reason,
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });

    void this.auditLog.record({
      tenantId,
      userId: actor.userId,
      action: 'APPROVED',
      resource: 'leave_request',
      resourceId: id,
      payload: { comments: note },
      ipAddress: actor.ip,
    });
    void dispatchNotification('leave-approved', {
      tenantId,
      leaveRequestId: id,
      employeeId: updated.employeeId,
      employeeEmail: updated.employee.email,
      leaveType: updated.leaveType.name,
    });

    return updated;
  }

  async rejectLeaveRequest(
    tenantId: string,
    id: string,
    actor: { userId: string; roles: string[]; email?: string; ip?: string },
    note?: string,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Leave request not found');
    }
    await this.assertCanActOnRequest(tenantId, request, actor);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Leave request is already processed');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: actor.userId,
        approvedAt: new Date(),
        rejectionReason: note,
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });

    void this.auditLog.record({
      tenantId,
      userId: actor.userId,
      action: 'REJECTED',
      resource: 'leave_request',
      resourceId: id,
      payload: { comments: note },
      ipAddress: actor.ip,
    });
    void dispatchNotification('leave-rejected', {
      tenantId,
      leaveRequestId: id,
      employeeId: updated.employeeId,
      employeeEmail: updated.employee.email,
      leaveType: updated.leaveType.name,
      reason: note,
    });

    return updated;
  }

  async requestMoreInfo(
    tenantId: string,
    id: string,
    actor: { userId: string; roles: string[]; email?: string; ip?: string },
    note: string,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Leave request not found');
    }
    await this.assertCanActOnRequest(tenantId, request, actor);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Leave request is already processed');
    }
    if (!note?.trim()) {
      throw new BadRequestException('A note is required when requesting more information');
    }

    void this.auditLog.record({
      tenantId,
      userId: actor.userId,
      action: 'INFO_REQUESTED',
      resource: 'leave_request',
      resourceId: id,
      payload: { comments: note },
      ipAddress: actor.ip,
    });
    void dispatchNotification('leave-info-requested', {
      tenantId,
      leaveRequestId: id,
      employeeId: request.employeeId,
      employeeEmail: request.employee.email,
      note,
    });

    return { requested: true };
  }

  async uploadLeaveAttachment(
    tenantId: string,
    id: string,
    contentType: string,
    fileSize: number,
  ): Promise<{ uploadUrl: string; objectKey: string }> {
    const request = await this.prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!request) throw new NotFoundException('Leave request not found');

    const extension = contentType.includes('/') ? contentType.split('/')[1] : 'bin';
    const objectKey = `leave/${request.id}/attachment-${Date.now()}.${extension}`;
    const presign = await this.requestPresign(tenantId, objectKey, contentType, fileSize);

    await this.prisma.leaveRequest.update({
      where: { id: request.id },
      data: { attachmentS3Key: presign.key },
    });

    return { uploadUrl: presign.uploadUrl, objectKey: presign.key };
  }

  private async requestPresign(
    tenantId: string,
    objectKey: string,
    contentType: string,
    fileSize: number,
  ): Promise<{ uploadUrl: string; key: string }> {
    const base = (process.env.DOCUMENT_SERVICE_URL ?? 'http://document-service:3018').replace(/\/$/, '');
    const key = process.env.INTERNAL_API_KEY;
    if (!key) throw new ServiceUnavailableException('Document service not configured');

    const response = await fetch(`${base}/api/v1/document/internal/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': key,
      },
      body: JSON.stringify({ tenantId, objectKey, contentType, fileSize }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Failed to obtain upload URL from document service');
    }

    const body = (await response.json()) as { data?: { uploadUrl: string; key: string } };
    if (!body.data?.uploadUrl || !body.data?.key) {
      throw new ServiceUnavailableException('Document service returned an unexpected response');
    }
    return body.data;
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
