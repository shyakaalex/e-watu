import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ProfileSearchFilters = {
  q?: string;
  tags?: string[];
  source?: string;
  poolId?: string;
};

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(tenantId: string, filters: ProfileSearchFilters = {}) {
    const where: Prisma.TalentPoolProfileWhereInput = { tenantId };
    if (filters.poolId) where.poolId = filters.poolId;
    if (filters.source) where.source = filters.source;
    if (filters.tags?.length) where.tags = { hasSome: filters.tags };
    if (filters.q) {
      const q = filters.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.talentPoolProfile.findMany({
      where,
      include: { pool: { select: { id: true, name: true } } },
      orderBy: { addedAt: 'desc' },
    });

    const byCandidate = new Map<
      string,
      {
        candidateId: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        tags: string[];
        source: string | null;
        pools: { id: string; name: string }[];
      }
    >();

    for (const row of rows) {
      const existing = byCandidate.get(row.candidateId);
      const poolRef = { id: row.pool.id, name: row.pool.name };
      if (existing) {
        if (!existing.pools.some((p) => p.id === poolRef.id)) existing.pools.push(poolRef);
      } else {
        byCandidate.set(row.candidateId, {
          candidateId: row.candidateId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          tags: row.tags,
          source: row.source,
          pools: [poolRef],
        });
      }
    }

    return Array.from(byCandidate.values());
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
