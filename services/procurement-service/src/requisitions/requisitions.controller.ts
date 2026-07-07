import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { RequisitionsService } from './requisitions.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';

@Controller('procurement/requisitions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RequisitionsController {
  constructor(private readonly service: RequisitionsService) {}

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.TENANT_STAFF)
  @RequirePermissions('self:*')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRequisitionDto) {
    return this.service.create(user.tenant_id as string, user.sub, dto);
  }

  @Post(':id/submit')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.TENANT_STAFF)
  @RequirePermissions('self:*')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.submit(user.tenant_id as string, id, user.sub);
  }

  @Post(':id/approve')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.CFO)
  @RequirePermissions('procurement:approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.approve(user.tenant_id as string, id, user.sub);
  }

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.CFO)
  @RequirePermissions('procurement:*')
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.tenant_id as string);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.CFO, EwatuRole.TENANT_STAFF)
  @RequirePermissions('self:*')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenant_id as string, id);
  }
}
