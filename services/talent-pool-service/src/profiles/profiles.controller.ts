import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  search(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('source') source?: string,
    @Query('poolId') poolId?: string,
    @Query('tags') tags?: string | string[],
  ) {
    const tid = this.profiles.requireTenant(user.tenant_id);
    const tagList = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;
    return this.profiles.search(tid, { q, source, poolId, tags: tagList });
  }
}
