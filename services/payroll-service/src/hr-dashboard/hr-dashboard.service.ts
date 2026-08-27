import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LIFECYCLE_ALERT_WINDOW_DAYS = 90;

@Injectable()
export class HrDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const [
      headcount,
      leave,
      payroll,
      lifecycleAlerts,
      performance,
      turnover,
      disciplinary,
      attendance,
      training,
      grievances,
    ] = await Promise.all([
      this.getHeadcount(tenantId),
      this.getLeaveSummary(tenantId),
      this.getPayrollCycleStatus(tenantId),
      this.getLifecycleAlerts(tenantId),
      this.getPerformanceCompletion(tenantId),
      this.getTurnover(tenantId),
      this.getDisciplinaryCount(tenantId),
      this.getAttendanceAnomalies(tenantId),
      this.getTrainingCompliance(tenantId),
      this.getGrievanceSummary(tenantId),
    ]);
    return {
      headcount,
      leave,
      payroll,
      lifecycleAlerts,
      performance,
      turnover,
      disciplinary,
      attendance,
      training,
      grievances,
    };
  }

  private async getHeadcount(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, employmentStatus: 'ACTIVE' },
      select: { department: true, employeeType: true, location: true },
    });
    const byDepartment = new Map<string, number>();
    const byType = new Map<string, number>();
    const byLocation = new Map<string, number>();
    for (const e of employees) {
      const dept = e.department ?? 'Unassigned';
      const location = e.location ?? 'Unassigned';
      byDepartment.set(dept, (byDepartment.get(dept) ?? 0) + 1);
      byType.set(e.employeeType, (byType.get(e.employeeType) ?? 0) + 1);
      byLocation.set(location, (byLocation.get(location) ?? 0) + 1);
    }
    return {
      total: employees.length,
      byDepartment: [...byDepartment.entries()]
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count),
      byType: [...byType.entries()].map(([type, count]) => ({ type, count })),
      byLocation: [...byLocation.entries()]
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  private async getLeaveSummary(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [pendingApprovals, approvedThisMonth, rejectedThisMonth] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.leaveRequest.count({ where: { tenantId, status: 'APPROVED', approvedAt: { gte: monthStart } } }),
      this.prisma.leaveRequest.count({ where: { tenantId, status: 'REJECTED', approvedAt: { gte: monthStart } } }),
    ]);
    return { pendingApprovals, approvedThisMonth, rejectedThisMonth };
  }

  private async getPayrollCycleStatus(tenantId: string) {
    const inProgressPeriods = await this.prisma.payrollPeriod.findMany({
      where: { tenantId, status: { not: 'FINALIZED' } },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      take: 10,
    });

    if (inProgressPeriods.length === 0) {
      return { inProgressPeriods: [], exceptionsCount: 0, exceptions: [] };
    }

    const records = await this.prisma.payrollRecord.findMany({
      where: { tenantId, periodId: { in: inProgressPeriods.map((p) => p.id) } },
      select: {
        id: true,
        netPay: true,
        periodId: true,
        employee: { select: { id: true, firstName: true, lastName: true, bankAccountEncrypted: true } },
      },
    });

    const recordCountByPeriod = new Map<string, number>();
    const exceptions: { employeeId: string; employeeName: string; issue: string }[] = [];
    for (const r of records) {
      recordCountByPeriod.set(r.periodId, (recordCountByPeriod.get(r.periodId) ?? 0) + 1);
      const name = `${r.employee.firstName} ${r.employee.lastName}`;
      if (!r.employee.bankAccountEncrypted) {
        exceptions.push({ employeeId: r.employee.id, employeeName: name, issue: 'Missing bank account details' });
      }
      if (Number(r.netPay) <= 0) {
        exceptions.push({ employeeId: r.employee.id, employeeName: name, issue: 'Zero or negative net pay' });
      }
    }

    return {
      inProgressPeriods: inProgressPeriods.map((p) => ({
        id: p.id,
        periodMonth: p.periodMonth,
        periodYear: p.periodYear,
        status: p.status,
        recordCount: recordCountByPeriod.get(p.id) ?? 0,
      })),
      exceptionsCount: exceptions.length,
      exceptions: exceptions.slice(0, 20),
    };
  }

  private async getLifecycleAlerts(tenantId: string) {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + LIFECYCLE_ALERT_WINDOW_DAYS * 86400000);

    const [contracts, permits, probations, documents] = await Promise.all([
      this.prisma.employeeContract.findMany({
        where: { tenantId, status: 'ACTIVE', endDate: { gte: now, lte: windowEnd } },
        select: { id: true, endDate: true, employee: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),
      this.prisma.permit.findMany({
        where: { tenantId, status: 'APPROVED', expiryDate: { gte: now, lte: windowEnd } },
        select: {
          id: true,
          expiryDate: true,
          permitType: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: 20,
      }),
      this.prisma.employee.findMany({
        where: {
          tenantId,
          employmentStatus: 'ACTIVE',
          probationEndDate: { gte: now, lte: windowEnd },
        },
        select: { id: true, firstName: true, lastName: true, probationEndDate: true },
        orderBy: { probationEndDate: 'asc' },
        take: 20,
      }),
      this.prisma.employeeDocument.findMany({
        where: { tenantId, expiryDate: { gte: now, lte: windowEnd } },
        select: {
          id: true,
          name: true,
          expiryDate: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: 20,
      }),
    ]);

    return {
      contractsExpiringSoon: contracts.map((c) => ({
        id: c.id,
        employeeId: c.employee.id,
        employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
        endDate: c.endDate,
      })),
      permitsExpiringSoon: permits.map((p) => ({
        id: p.id,
        employeeId: p.employee.id,
        employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
        expiryDate: p.expiryDate,
        permitType: p.permitType,
      })),
      probationsEndingSoon: probations.map((e) => ({
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        probationEndDate: e.probationEndDate,
      })),
      documentsExpiringSoon: documents.map((d) => ({
        id: d.id,
        employeeId: d.employee.id,
        employeeName: `${d.employee.firstName} ${d.employee.lastName}`,
        documentName: d.name,
        expiryDate: d.expiryDate,
      })),
    };
  }

  private async getPerformanceCompletion(tenantId: string) {
    const cycle = await this.prisma.appraisalCycle.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });
    if (!cycle) return null;

    const appraisals = await this.prisma.appraisal.findMany({
      where: { tenantId, cycleId: cycle.id },
      select: { status: true },
    });
    const total = appraisals.length;
    const completed = appraisals.filter((a) => a.status === 'COMPLETED').length;
    const now = new Date();
    const overdueCount = now > cycle.hrValidationDeadline ? total - completed : 0;

    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      totalEmployees: total,
      completedCount: completed,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdueCount,
    };
  }

  private async getTurnover(tenantId: string) {
    const now = new Date();
    const yearAgo = new Date(now);
    yearAgo.setFullYear(now.getFullYear() - 1);

    const [terminatedLast12Months, currentActiveHeadcount] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId, employmentStatus: 'TERMINATED', endDate: { gte: yearAgo } } }),
      this.prisma.employee.count({ where: { tenantId, employmentStatus: 'ACTIVE' } }),
    ]);

    const ratePct =
      currentActiveHeadcount > 0 ? Math.round((terminatedLast12Months / currentActiveHeadcount) * 1000) / 10 : 0;

    return { terminatedLast12Months, currentActiveHeadcount, ratePct };
  }

  private async getDisciplinaryCount(tenantId: string) {
    const [activeCount, escalatedCount] = await Promise.all([
      this.prisma.performanceImprovementPlan.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.performanceImprovementPlan.count({ where: { tenantId, status: 'ESCALATED' } }),
    ]);
    return { activeCount, escalatedCount };
  }

  private async getAttendanceAnomalies(tenantId: string) {
    const now = new Date();
    const start30 = new Date(now.getTime() - 30 * 86400000);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId, date: { gte: start30 } },
      select: { status: true },
    });
    const total = records.length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;

    return {
      lateCount30d: lateCount,
      absentCount30d: absentCount,
      onTimeRatePct: total > 0 ? Math.round((presentCount / total) * 1000) / 10 : null,
    };
  }

  private async getTrainingCompliance(tenantId: string) {
    const now = new Date();
    const courses = await this.prisma.trainingCourse.findMany({
      where: { tenantId, mandatory: true },
      include: { records: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => {
      const total = c.records.length;
      const completed = c.records.filter((r) => r.status === 'COMPLETED').length;
      const overdueCount = c.dueDate && now > c.dueDate ? total - completed : 0;
      return {
        courseId: c.id,
        courseName: c.name,
        totalAssigned: total,
        completedCount: completed,
        completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
        overdueCount,
      };
    });
  }

  private async getGrievanceSummary(tenantId: string) {
    const [openCount, investigatingCount] = await Promise.all([
      this.prisma.grievanceCase.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.grievanceCase.count({ where: { tenantId, status: 'INVESTIGATING' } }),
    ]);
    return { openCount, investigatingCount };
  }
}
