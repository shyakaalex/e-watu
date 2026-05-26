import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCandidateDto } from './dtos/create-candidate.dto';
import type { UpdateCandidateDto } from './dtos/update-candidate.dto';

export type FindAllCandidatesFilters = {
  q?: string;
  source?: string;
  tags?: string[];
  page?: number;
  limit?: number;
};

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, filters: FindAllCandidatesFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = {
      tenantId,
      archived: false,
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
    };
    if (filters.q) {
      const q = filters.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { currentTitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async findOne(tenantId: string, id: string) {
    const c = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
      include: {
        applications: {
          include: { job: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!c || c.tenantId !== tenantId) throw new NotFoundException('Candidate not found');
    return c;
  }

  async create(tenantId: string, dto: CreateCandidateDto) {
    try {
      return await this.prisma.candidate.create({
        data: {
          tenantId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          phone: dto.phone ?? null,
          cvUrl: dto.cvUrl ?? null,
          linkedinUrl: dto.linkedinUrl ?? null,
          currentTitle: dto.currentTitle ?? null,
          source: dto.source ?? 'MANUAL',
          notes: dto.notes ?? null,
          tags: dto.tags ?? [],
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        await this.throwDuplicateEmail(tenantId, dto.email);
      }
      throw e;
    }
  }

  async update(tenantId: string, id: string, dto: UpdateCandidateDto) {
    const c = await this.prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!c || c.tenantId !== tenantId) throw new NotFoundException('Candidate not found');
    try {
      return await this.prisma.candidate.update({
        where: { id },
        data: { ...dto, email: dto.email?.toLowerCase() },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        await this.throwDuplicateEmail(tenantId, dto.email ?? c.email);
      }
      throw e;
    }
  }

  async archive(tenantId: string, id: string) {
    const c = await this.prisma.candidate.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Candidate not found');
    return this.prisma.candidate.update({
      where: { id },
      data: { archived: true },
    });
  }

  private async throwDuplicateEmail(tenantId: string, email: string) {
    const existing = await this.prisma.candidate.findUnique({
      where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
    });
    throw new ConflictException({
      message: 'Candidate with this email already exists',
      existingId: existing?.id,
    });
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
