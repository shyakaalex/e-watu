import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { ApprovePeriodDto } from './dto/approve-period.dto';
import { CreatePeriodDto } from './dto/create-period.dto';
import { PeriodsService } from './periods.service';

function derivePayrollApproverRole(roles: string[]): string | undefined {
  if (roles.includes(EwatuRole.HR_MANAGER)) return EwatuRole.HR_MANAGER;
  if (roles.includes(EwatuRole.TENANT_ADMIN)) return EwatuRole.TENANT_ADMIN;
  if (roles.includes(EwatuRole.CLIENT_ADMIN)) return EwatuRole.CLIENT_ADMIN;
  return undefined;
}

@Controller('payroll/periods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodsController {
  constructor(private readonly service: PeriodsService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.CLIENT_ADMIN)
  findAll(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.service.findAll(user.tenant_id as string, query);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePeriodDto) {
    return this.service.create(user.tenant_id as string, user.sub, dto);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER, EwatuRole.CLIENT_ADMIN)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenant_id as string, id);
  }

  @Post(':id/run')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  run(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.runPayroll(user.tenant_id as string, id);
  }

  @Post(':id/submit')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.submit(user.tenant_id as string, id);
  }

  @Post(':id/approve')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.CLIENT_ADMIN)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApprovePeriodDto,
  ) {
    const derivedRole = derivePayrollApproverRole(user.roles);
    return this.service.approve(user.tenant_id as string, id, user.sub, derivedRole ?? '', dto);
  }

  @Post(':id/reject')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.CLIENT_ADMIN)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApprovePeriodDto,
  ) {
    const derivedRole = derivePayrollApproverRole(user.roles);
    return this.service.reject(user.tenant_id as string, id, user.sub, derivedRole ?? '', dto);
  }

  @Post(':id/finalize')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  finalize(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.finalize(user.tenant_id as string, id, user.sub);
  }
}
