import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
  Roles,
  RequirePermissions,
  EwatuRole,
} from '@ewatu/common-auth';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { WriteOffLoanDto } from './dto/write-off-loan.dto';
import { AddCollateralDto } from './dto/add-collateral.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';

const READ_ROLES = [
  EwatuRole.TENANT_ADMIN,
  EwatuRole.HR_MANAGER,
  EwatuRole.FINANCE_OFFICER,
  EwatuRole.CFO,
  EwatuRole.TENANT_STAFF,
];
const APPLY_ROLES = [EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.TENANT_STAFF];
const APPROVE_ROLES = [EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER, EwatuRole.CFO];

@Controller('lending/loans')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Post()
  @Roles(...APPLY_ROLES)
  @RequirePermissions('lending:apply')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLoanDto) {
    return this.service.create(user.tenant_id as string, user.sub, dto);
  }

  @Get()
  @Roles(...READ_ROLES)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('borrowerId') borrowerId?: string,
  ) {
    return this.service.findAll(user.tenant_id as string, { status, borrowerId });
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenant_id as string, id);
  }

  @Get(':id/schedule')
  @Roles(...READ_ROLES)
  getSchedule(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getSchedule(user.tenant_id as string, id);
  }

  @Post(':id/collateral')
  @Roles(...APPLY_ROLES)
  @RequirePermissions('lending:apply')
  addCollateral(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddCollateralDto) {
    return this.service.addCollateral(user.tenant_id as string, user.sub, id, dto);
  }

  @Post(':id/submit')
  @Roles(...APPLY_ROLES)
  @RequirePermissions('lending:apply')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.submit(user.tenant_id as string, user.sub, id);
  }

  @Post(':id/approve')
  @Roles(...APPROVE_ROLES)
  @RequirePermissions('lending:approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.approve(user.tenant_id as string, user.sub, id);
  }

  @Post(':id/reject')
  @Roles(...APPROVE_ROLES)
  @RequirePermissions('lending:approve')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RejectLoanDto) {
    return this.service.reject(user.tenant_id as string, user.sub, id, dto);
  }

  @Post(':id/disburse')
  @Roles(...APPROVE_ROLES)
  @RequirePermissions('lending:approve')
  disburse(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.disburse(user.tenant_id as string, user.sub, id);
  }

  @Post(':id/repayments')
  @Roles(...APPROVE_ROLES)
  @RequirePermissions('lending:approve')
  recordRepayment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RecordRepaymentDto) {
    return this.service.recordRepayment(user.tenant_id as string, user.sub, id, dto);
  }

  @Post(':id/write-off')
  @Roles(...APPROVE_ROLES)
  @RequirePermissions('lending:approve')
  writeOff(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: WriteOffLoanDto) {
    return this.service.writeOff(user.tenant_id as string, user.sub, id, dto);
  }
}
