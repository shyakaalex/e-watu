import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService, type ProfileSearchFilters } from '../profiles/profiles.service';
import type { CreateSearchDto } from './dto/create-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.savedSearch.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, dto: CreateSearchDto) {
    return this.prisma.savedSearch.create({
      data: {
        tenantId,
        name: dto.name,
        filters: dto.filters as Prisma.InputJsonValue,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const row = await this.prisma.savedSearch.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Saved search not found');
    await this.prisma.savedSearch.delete({ where: { id } });
    return { deleted: true };
  }

  async run(tenantId: string, id: string) {
    const row = await this.prisma.savedSearch.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Saved search not found');
    const filters = row.filters as ProfileSearchFilters;
    return this.profiles.search(tenantId, filters);
  }

  requireTenant(tenantId?: string): string {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }
}
