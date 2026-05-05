import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
import { TenantService } from '../tenant/tenant.service';

@Controller('my')
export class MyController {
  constructor(private readonly tenant: TenantService) {}

  /** Current user's company (tenant), if they belong to one. */
  @UseGuards(JwtAuthGuard)
  @Get('tenant')
  myTenant(@CurrentUser() user: AuthUser) {
    if (!user.tenant_id) {
      return null;
    }
    return this.tenant.findById(user.tenant_id);
  }
}
