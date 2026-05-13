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

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, query?: string) {
    const where: Prisma.CandidateWhereInput = { tenantId };
    if (query) {
      const q = query.trim();
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
    });
  }

  async findOne(tenantId: string, id: string) {
    const c = await this.prisma.candidate.findUnique({
      where: { id },
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
          source: dto.source ?? 'DIRECT',
          notes: dto.notes ?? null,
          tags: dto.tags ?? [],
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A candidate with this email already exists');
      }
      throw e;
    }
  }

  async update(tenantId: string, id: string, dto: UpdateCandidateDto) {
    const c = await this.prisma.candidate.findUnique({ where: { id } });
    if (!c || c.tenantId !== tenantId) throw new NotFoundException('Candidate not found');
    try {
      return await this.prisma.candidate.update({
        where: { id },
        data: { ...dto, email: dto.email?.toLowerCase() },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A candidate with this email already exists');
      }
      throw e;
    }
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
