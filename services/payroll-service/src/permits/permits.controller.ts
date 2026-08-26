import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { PermitsService } from './permits.service';

@Controller('permits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermitsController {
  constructor(private readonly svc: PermitsService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  list(@CurrentUser() u: AuthUser, @Query('status') status?: string) {
    return this.svc.listPermits(u.tenant_id as string, status);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.getPermit(u.tenant_id as string, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  create(
    @CurrentUser() u: AuthUser,
    @Body()
    body: {
      employeeId: string;
      permitNumber: string;
      permitType: 'WORK_PERMIT' | 'VISA' | 'RESIDENCE_PERMIT';
      country?: string;
      expiryDate: string;
    },
  ) {
    return this.svc.createPermit(u.tenant_id as string, body);
  }

  @Patch(':id/checklist/:itemId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  updateChecklistItem(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { status: 'PENDING' | 'UPLOADED' | 'VERIFIED'; fileKey?: string },
  ) {
    return this.svc.updateChecklistItem(u.tenant_id as string, id, itemId, body);
  }
}
