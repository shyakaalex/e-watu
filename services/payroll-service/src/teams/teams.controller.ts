import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listTeams(user.tenant_id as string);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listMyTeams(user.tenant_id as string, user.email as string);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getTeam(user.tenant_id as string, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  create(@CurrentUser() user: AuthUser, @Body() body: { name: string; parentTeamId?: string }) {
    return this.service.createTeam(user.tenant_id as string, body);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; parentTeamId?: string | null },
  ) {
    return this.service.updateTeam(user.tenant_id as string, id, body);
  }

  @Delete(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteTeam(user.tenant_id as string, id);
  }

  @Post(':id/members')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { employeeId: string; role?: 'LEAD' | 'CORE' | 'MEMBER' },
  ) {
    return this.service.addMember(user.tenant_id as string, id, body);
  }

  @Patch(':id/members/:employeeId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { role: 'LEAD' | 'CORE' | 'MEMBER' },
  ) {
    return this.service.updateMember(user.tenant_id as string, id, employeeId, body);
  }

  @Delete(':id/members/:employeeId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('employeeId') employeeId: string) {
    return this.service.removeMember(user.tenant_id as string, id, employeeId);
  }
}
