import { Body, Controller, ForbiddenException, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { TenantService } from '../tenant/tenant.service';
import { UpdateTenantSettingsDto } from './dtos/update-tenant-settings.dto';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.PLATFORM_SUPER_ADMIN)
  @Patch('tenant/settings')
  async updateSettings(@CurrentUser() user: AuthUser, @Body() body: UpdateTenantSettingsDto) {
    if (!user.tenant_id) {
      throw new ForbiddenException('No company linked to this account');
    }
    return this.tenant.updateSettings(user.tenant_id, body);
  }
}
