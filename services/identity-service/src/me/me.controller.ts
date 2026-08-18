import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  AllowTenantStatus,
  AuthUser,
  CurrentUser,
  JwtAuthGuard,
} from '@ewatu/common-auth';

@SkipThrottle()
@Controller('me')
export class MeController {
  @UseGuards(JwtAuthGuard)
  @AllowTenantStatus('SUSPENDED', 'EXPIRED', 'PENDING_ACTIVATION', 'REJECTED')
  @Get()
  me(@CurrentUser() user: AuthUser) {
    return {
      sub: user.sub,
      email: user.email,
      username: user.preferred_username,
      tenant_id: user.tenant_id,
      tenant_status: user.tenant_status,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
