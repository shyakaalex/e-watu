import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  AuthUser,
  CurrentUser,
  JwtAuthGuard,
} from '@ewatu/common-auth';

@SkipThrottle()
@Controller('me')
export class MeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  me(@CurrentUser() user: AuthUser) {
    return {
      sub: user.sub,
      email: user.email,
      username: user.preferred_username,
      tenant_id: user.tenant_id,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
