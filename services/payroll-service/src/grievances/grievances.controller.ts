import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { GrievancesService } from './grievances.service';

@Controller('grievances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GrievancesController {
  constructor(private readonly service: GrievancesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: { category: string; description: string }) {
    return this.service.createGrievance(user.tenant_id as string, user.email, body);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listMyGrievances(user.tenant_id as string, user.email);
  }

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  listAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.service.listAll(user.tenant_id as string, status);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status?: string; resolutionNotes?: string },
  ) {
    return this.service.updateCase(
      user.tenant_id as string,
      id,
      user.preferred_username ?? user.email ?? 'HR',
      body,
    );
  }
}
