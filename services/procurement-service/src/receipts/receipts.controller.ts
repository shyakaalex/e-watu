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
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Controller('procurement/receipts')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  @RequirePermissions('procurement:*')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReceiptDto) {
    return this.service.create(user.tenant_id as string, user.sub, dto);
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
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.CFO)
  @RequirePermissions('procurement:*')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenant_id as string, id);
  }
}
