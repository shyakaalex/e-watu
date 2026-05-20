import { Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from './internal-api.guard';
import { TenantService } from '../tenant/tenant.service';

@Controller('internal')
@UseGuards(InternalApiGuard)
export class InternalController {
  constructor(private readonly tenant: TenantService) {}

  @Get('tenants/by-slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    const t = await this.tenant.findBySlug(slug);
    if (!t) throw new NotFoundException();
    return { id: t.id, name: t.name, slug: t.slug, status: t.status };
  }

  @Patch('tenants/:tenantId/email-verified')
  markEmailVerified(@Param('tenantId') tenantId: string) {
    return this.tenant.markOwnerEmailVerified(tenantId);
  }
}

