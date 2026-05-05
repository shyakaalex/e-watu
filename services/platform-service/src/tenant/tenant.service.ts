import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';

@Injectable()
export class TenantService {
  private readonly log = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
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
    this.log.log(
      `[email stub] Your company ${t.name} is approved — would email ${t.businessEmail ?? t.ownerUserId}`,
    );
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
    this.log.log(`[email stub] Tenant ${t.slug} rejected — would email ${t.businessEmail}`);
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
