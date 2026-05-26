import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AddCandidateDto } from './dto/add-candidate.dto';
import type { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';

@Injectable()
export class PoolsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, tags?: string[]) {
    const where: Prisma.TalentPoolWhereInput = { tenantId };
    if (tags?.length) where.tags = { hasSome: tags };
    return this.prisma.talentPool.findMany({
      where,
      include: { _count: { select: { profiles: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const pool = await this.prisma.talentPool.findFirst({
      where: { id, tenantId },
      include: {
        profiles: { orderBy: { addedAt: 'desc' } },
        _count: { select: { profiles: true } },
      },
    });
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  create(tenantId: string, dto: CreatePoolDto) {
    return this.prisma.talentPool.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description ?? null,
        tags: dto.tags ?? [],
      },
      include: { _count: { select: { profiles: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePoolDto) {
    await this.ensurePool(tenantId, id);
    return this.prisma.talentPool.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      },
      include: { _count: { select: { profiles: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.ensurePool(tenantId, id);
    await this.prisma.talentPool.delete({ where: { id } });
    return { deleted: true };
  }

  async addCandidate(tenantId: string, poolId: string, dto: AddCandidateDto) {
    await this.ensurePool(tenantId, poolId);
    const existing = await this.prisma.talentPoolProfile.findUnique({
      where: { poolId_candidateId: { poolId, candidateId: dto.candidateId } },
    });
    if (existing) return existing;

    return this.prisma.talentPoolProfile.create({
      data: {
        tenantId,
        poolId,
        candidateId: dto.candidateId,
        notes: dto.notes ?? null,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        email: dto.email ?? null,
        tags: dto.tags ?? [],
        source: dto.source ?? null,
      },
    });
  }

  async removeCandidate(tenantId: string, poolId: string, candidateId: string) {
    await this.ensurePool(tenantId, poolId);
    const profile = await this.prisma.talentPoolProfile.findUnique({
      where: { poolId_candidateId: { poolId, candidateId } },
    });
    if (!profile || profile.tenantId !== tenantId) {
      throw new NotFoundException('Candidate not in pool');
    }
    await this.prisma.talentPoolProfile.delete({ where: { id: profile.id } });
    return { removed: true };
  }

  private async ensurePool(tenantId: string, id: string) {
    const pool = await this.prisma.talentPool.findFirst({ where: { id, tenantId } });
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
