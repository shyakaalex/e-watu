import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '@ewatu/common-auth';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
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

  private getEncryptionKey(): Buffer {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
      throw new ForbiddenException('ENCRYPTION_KEY not configured');
    }
    return Buffer.from(hex, 'hex');
  }

  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(stored: string): string {
    const [ivHex, cipherHex] = stored.split(':');
    if (!ivHex || !cipherHex) return '';
    const key = this.getEncryptionKey();
    const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private sanitizeEmployee<T extends Record<string, unknown>>(employee: T) {
    const { nationalIdEncrypted: _nationalIdEncrypted, bankAccountEncrypted: _bankAccountEncrypted, ...rest } =
      employee;
    return rest;
  }

  private enrichDetail<T extends { nationalIdEncrypted?: string | null; bankAccountEncrypted?: string | null }>(
    employee: T,
  ) {
    const sanitized = this.sanitizeEmployee(employee as Record<string, unknown>);
    return {
      ...sanitized,
      ...(employee.nationalIdEncrypted
        ? { nationalId: this.decrypt(employee.nationalIdEncrypted) }
        : {}),
      ...(employee.bankAccountEncrypted
        ? { bankAccount: this.decrypt(employee.bankAccountEncrypted) }
        : {}),
    };
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const nationalIdEncrypted = dto.nationalId ? this.encrypt(dto.nationalId) : undefined;
    const bankAccountEncrypted = dto.bankAccount ? this.encrypt(dto.bankAccount) : undefined;
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
    return this.enrichDetail(employee);
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Employee not found');

    const nationalIdEncrypted = dto.nationalId ? this.encrypt(dto.nationalId) : undefined;
    const bankAccountEncrypted = dto.bankAccount ? this.encrypt(dto.bankAccount) : undefined;
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
    return this.enrichDetail(updated);
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
    const lookupId = dto.candidateId ?? dto.placementId;
    const duplicate = lookupId
      ? await this.prisma.employee.findFirst({ where: { tenantId, candidateId: lookupId } })
      : null;
    if (duplicate) throw new ConflictException('Employee already exists for this candidate');
    return this.create(tenantId, {
      ...dto,
      clientId: dto.clientId ?? dto.placementId,
      candidateId: lookupId,
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
