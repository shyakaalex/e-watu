import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '@ewatu/common-auth';
import { EmploymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dtos/create-employee.dto';
import { CreateEmployeeFromPlacementDto } from './dtos/create-employee-from-placement.dto';
import { UpdateEmployeeDto } from './dtos/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }

  private sanitizeEmployee<T extends Record<string, unknown>>(employee: T) {
    const { nationalIdEncrypted: _nationalIdEncrypted, bankAccountEncrypted: _bankAccountEncrypted, ...rest } =
      employee;
    return rest;
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const nationalIdEncrypted = dto.nationalId ? Buffer.from(dto.nationalId).toString('base64') : undefined;
    const bankAccountEncrypted = dto.bankAccount
      ? Buffer.from(dto.bankAccount).toString('base64')
      : undefined;
    const { nationalId: _nationalId, bankAccount: _bankAccount, ...rest } = dto;

    const created = await this.prisma.employee.create({
      data: {
        tenantId,
        ...rest,
        employeeType: dto.employeeType ?? 'OUTSOURCED',
        basicSalary: dto.basicSalary ?? 0,
        housingAllowance: dto.housingAllowance ?? 0,
        transportAllowance: dto.transportAllowance ?? 0,
        otherAllowances: dto.otherAllowances ?? 0,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationalIdEncrypted,
        bankAccountEncrypted,
      },
    });

    return this.sanitizeEmployee(created);
  }

  async findAll(tenantId: string, query: Record<string, string | undefined>) {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '20', 10) || 20));
    const search = query.search?.trim();
    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.employeeType ? { employeeType: query.employeeType as any } : {}),
      ...(query.employmentStatus ? { employmentStatus: query.employmentStatus as any } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contracts: { orderBy: { startDate: 'desc' }, take: 1 },
          _count: { select: { payrollRecords: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: items.map((item) => this.sanitizeEmployee(item)),
      page,
      limit,
      total,
    };
  }

  async findOne(tenantId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        contracts: { orderBy: { startDate: 'desc' } },
        payrollRecords: {
          orderBy: [{ period: { periodYear: 'desc' } }, { period: { periodMonth: 'desc' } }],
          take: 3,
          include: { period: true },
        },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.sanitizeEmployee(employee);
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Employee not found');

    const nationalIdEncrypted = dto.nationalId ? Buffer.from(dto.nationalId).toString('base64') : undefined;
    const bankAccountEncrypted = dto.bankAccount
      ? Buffer.from(dto.bankAccount).toString('base64')
      : undefined;
    const { nationalId: _nationalId, bankAccount: _bankAccount, ...rest } = dto;

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        ...(nationalIdEncrypted ? { nationalIdEncrypted } : {}),
        ...(bankAccountEncrypted ? { bankAccountEncrypted } : {}),
      },
    });
    return this.sanitizeEmployee(updated);
  }

  async terminate(tenantId: string, id: string) {
    const existing = await this.prisma.employee.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Employee not found');
    return this.prisma.employee.update({
      where: { id },
      data: { employmentStatus: EmploymentStatus.TERMINATED, endDate: new Date() },
    });
  }

  async createFromPlacement(user: AuthUser, dto: CreateEmployeeFromPlacementDto) {
    const tenantId = this.requireTenant(user.tenant_id);
    const duplicate = dto.placementId
      ? await this.prisma.employee.findFirst({ where: { tenantId, clientId: dto.placementId } })
      : null;
    if (duplicate) throw new ConflictException('An employee record already exists for this placement');
    return this.create(tenantId, {
      ...dto,
      clientId: dto.clientId ?? dto.placementId,
      employeeType: dto.employeeType ?? 'OUTSOURCED',
      jobTitle: dto.jobTitle ?? 'Employee',
      startDate: dto.startDate ?? new Date().toISOString(),
    });
  }

  async convertFromPlacement(
    tenantId: string,
    id: string,
    body: { placementId?: string; candidateData?: Record<string, string | undefined> },
  ) {
    const existing = await this.prisma.employee.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Employee not found');
    return this.update(tenantId, id, {
      clientId: body.placementId ?? existing.clientId ?? undefined,
      firstName: body.candidateData?.firstName ?? existing.firstName,
      lastName: body.candidateData?.lastName ?? existing.lastName,
      email: body.candidateData?.email ?? existing.email,
      phone: body.candidateData?.phone ?? existing.phone ?? undefined,
    });
  }
}
