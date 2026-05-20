import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';

/** Unauthenticated careers portal metadata (ACTIVE tenants only). */
@Controller('public/tenants')
export class PublicController {
  constructor(private readonly tenant: TenantService) {}

  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    const t = await this.tenant.findBySlug(slug);
    if (!t || t.status !== 'ACTIVE') {
      throw new NotFoundException('Company not found');
    }
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      country: t.country,
      logoUrl: t.logoUrl,
      primaryColor: t.primaryColor,
      accentColor: t.accentColor,
      website: t.website,
    };
  }
}
