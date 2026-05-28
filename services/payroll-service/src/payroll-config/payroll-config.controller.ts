import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { PayrollConfigService } from './payroll-config.service';

@Controller('payroll/config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollConfigController {
  constructor(private readonly service: PayrollConfigService) {}

  @Get(':clientId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  get(@CurrentUser() user: AuthUser, @Param('clientId') clientId: string) {
    return this.service.getByClient(user.tenant_id as string, clientId);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConfigDto) {
    return this.service.create(user.tenant_id as string, dto);
  }

  @Patch(':clientId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('clientId') clientId: string,
    @Body() dto: UpdateConfigDto,
  ) {
    return this.service.update(user.tenant_id as string, clientId, dto);
  }
}
