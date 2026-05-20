import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotifyService } from '../notify/notify.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';

@Injectable()
export class TenantService {
  private readonly log = new Logger(TenantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async updateSettings(tenantId: string, data: {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    website?: string;
    baseCurrency?: string;
    fiscalYearStartMonth?: number;
  }) {
    try {
      return await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl || null } : {}),
          ...(data.primaryColor !== undefined ? { primaryColor: data.primaryColor } : {}),
          ...(data.accentColor !== undefined ? { accentColor: data.accentColor } : {}),
          ...(data.website !== undefined ? { website: data.website || null } : {}),
          ...(data.baseCurrency !== undefined ? { baseCurrency: data.baseCurrency } : {}),
          ...(data.fiscalYearStartMonth !== undefined
            ? { fiscalYearStartMonth: data.fiscalYearStartMonth }
            : {}),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Tenant not found');
      }
      throw e;
    }
  }

  findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findPending() {
    return this.prisma.tenant.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(id: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tenant not found');
    if (t.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only PENDING_APPROVAL tenants can be approved');
    }
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'ACTIVE', rejectionReason: null },
    });
    const webOrigin = process.env.WEB_APP_ORIGIN?.replace(/\/$/, '') ?? 'http://localhost:5173';
    await this.notify.dispatch({
      channel: 'both',
      to: t.businessEmail ?? undefined,
      userId: t.ownerUserId ?? undefined,
      tenantId: t.id,
      template: 'tenant-approved',
      payload: { companyName: t.name, loginUrl: `${webOrigin}/login` },
      title: 'Company approved',
      body: `Your workspace for ${t.name} is now active.`,
    });
    return updated;
  }

  async reject(id: string, reason?: string) {
    const t = await this.prisma.tenant.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tenant not found');
    if (t.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only PENDING_APPROVAL tenants can be rejected');
    }
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason?.trim() || null },
    });
    await this.notify.dispatch({
      channel: 'both',
      to: t.businessEmail ?? undefined,
      userId: t.ownerUserId ?? undefined,
      tenantId: t.id,
      template: 'tenant-rejected',
      payload: {
        companyName: t.name,
        reason: reason?.trim() || '',
      },
      title: 'Registration update',
      body: `Your registration for ${t.name} was not approved.`,
    });
    return updated;
  }

  async markOwnerEmailVerified(tenantId: string) {
    try {
      return await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { emailVerifiedAt: new Date() },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException();
      }
      throw e;
    }
  }

  async create(dto: CreateTenantDto) {
    try {
      return await this.prisma.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          plan: dto.plan ?? null,
          country: dto.country?.toUpperCase() ?? 'RW',
          status: dto.status ?? 'ACTIVE',
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `A tenant with slug "${dto.slug}" already exists`,
        );
      }
      throw e;
    }
  }
}
