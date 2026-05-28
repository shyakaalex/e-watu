import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractsService } from './contracts.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Post('employees/:employeeId/contracts')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  create(
    @CurrentUser() user: AuthUser,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.service.create(user.tenant_id as string, employeeId, dto);
  }

  @Get('employees/:employeeId/contracts')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  findByEmployee(@CurrentUser() user: AuthUser, @Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(user.tenant_id as string, employeeId);
  }

  @Get('contracts/expiring')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  findExpiring(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    return this.service.findExpiring(user.tenant_id as string, Number.parseInt(days ?? '30', 10) || 30);
  }

  @Get('contracts/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenant_id as string, id);
  }

  @Patch('contracts/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(user.tenant_id as string, id, dto);
  }

  @Post('contracts/:id/upload')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  upload(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { objectKey: string },
  ) {
    return this.service.uploadContract(user.tenant_id as string, id, body.objectKey);
  }
}
