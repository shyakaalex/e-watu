import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isIpAllowed } from './ip-network.util';
import { UpdateAttendanceNetworkPolicyDto } from './dtos/update-network-policy.dto';

const LATE_THRESHOLD_HOUR = 9;
const LATE_THRESHOLD_MINUTE = 15;

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCallerEmployee(tenantId: string, email?: string) {
    if (!email) return null;
    return this.prisma.employee.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });
  }

  /** Builds a UTC-midnight Date for the given LOCAL calendar day, so the day stored in the
   *  Postgres DATE column matches local wall-clock regardless of the server's UTC offset. */
  private startOfDay(d: Date): Date {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  private isLate(now: Date): boolean {
    return (
      now.getHours() > LATE_THRESHOLD_HOUR ||
      (now.getHours() === LATE_THRESHOLD_HOUR && now.getMinutes() > LATE_THRESHOLD_MINUTE)
    );
  }

  async clockIn(tenantId: string, callerEmail?: string, callerIp?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) throw new ForbiddenException('No linked employee record');
    await this.assertOnAllowedNetwork(tenantId, callerIp);

    const now = new Date();
    const date = this.startOfDay(now);
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { tenantId_employeeId_date: { tenantId, employeeId: me.id, date } },
    });
    if (existing?.clockInAt) throw new BadRequestException('Already clocked in today');

    const status = this.isLate(now) ? 'LATE' : 'PRESENT';
    if (existing) {
      return this.prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { clockInAt: now, status },
      });
    }
    return this.prisma.attendanceRecord.create({
      data: { tenantId, employeeId: me.id, date, clockInAt: now, status },
    });
  }

  async clockOut(tenantId: string, callerEmail?: string, callerIp?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) throw new ForbiddenException('No linked employee record');
    await this.assertOnAllowedNetwork(tenantId, callerIp);

    const date = this.startOfDay(new Date());
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { tenantId_employeeId_date: { tenantId, employeeId: me.id, date } },
    });
    if (!existing?.clockInAt) throw new BadRequestException('Clock in before clocking out');
    if (existing.clockOutAt) throw new BadRequestException('Already clocked out today');

    return this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { clockOutAt: new Date() },
    });
  }

  async listMine(tenantId: string, callerEmail?: string) {
    const me = await this.resolveCallerEmployee(tenantId, callerEmail);
    if (!me) return [];
    return this.prisma.attendanceRecord.findMany({
      where: { tenantId, employeeId: me.id },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  private async assertOnAllowedNetwork(tenantId: string, callerIp?: string) {
    const policy = await this.prisma.attendanceNetworkPolicy.findUnique({ where: { tenantId } });
    if (!policy?.enabled) return;
    if (!callerIp || !isIpAllowed(callerIp, policy.allowedCidrs)) {
      throw new ForbiddenException(
        'Clock-in/out is only allowed from the company office network. Connect to the office WiFi and try again.',
      );
    }
  }

  async getNetworkPolicy(tenantId: string) {
    const policy = await this.prisma.attendanceNetworkPolicy.findUnique({ where: { tenantId } });
    return policy ?? { tenantId, enabled: false, allowedCidrs: [] as string[] };
  }

  async updateNetworkPolicy(tenantId: string, dto: UpdateAttendanceNetworkPolicyDto, updatedByEmail?: string) {
    return this.prisma.attendanceNetworkPolicy.upsert({
      where: { tenantId },
      create: { tenantId, enabled: dto.enabled, allowedCidrs: dto.allowedCidrs, updatedByEmail },
      update: { enabled: dto.enabled, allowedCidrs: dto.allowedCidrs, updatedByEmail },
    });
  }
}
