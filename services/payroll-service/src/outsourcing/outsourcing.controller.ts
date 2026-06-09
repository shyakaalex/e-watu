import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { OutsourcingService } from './outsourcing.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateContractDto,
  UpdateContractDto,
  TerminateContractDto,
  RenewContractDto,
} from './dtos/outsourcing.dto';

@Controller('outsourcing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutsourcingController {
  constructor(private readonly svc: OutsourcingService) {}

  // ── Registry / Assignments ──────────────────────────────────────

  @Get('assignments')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  listAssignments(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.findAllAssignments(u.tenant_id as string, q);
  }

  @Get('bench')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  bench(@CurrentUser() u: AuthUser) {
    return this.svc.findBench(u.tenant_id as string);
  }

  @Post('assignments')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  createAssignment(@CurrentUser() u: AuthUser, @Body() body: CreateAssignmentDto) {
    return this.svc.createAssignment(u.tenant_id as string, u.sub, body);
  }

  @Patch('assignments/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  updateAssignment(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: UpdateAssignmentDto) {
    return this.svc.updateAssignment(u.tenant_id as string, u.sub, id, body);
  }

  @Get('assignments/:id/history')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  deploymentHistory(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.getDeploymentHistory(u.tenant_id as string, id);
  }

  // ── Secondment Contracts ────────────────────────────────────────

  @Get('contracts')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  listContracts(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.findAllContracts(u.tenant_id as string, q);
  }

  @Post('contracts')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  createContract(@CurrentUser() u: AuthUser, @Body() body: CreateContractDto) {
    return this.svc.createContract(u.tenant_id as string, u.sub, body);
  }

  @Patch('contracts/:id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  updateContract(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: UpdateContractDto) {
    return this.svc.updateContract(u.tenant_id as string, u.sub, id, body);
  }

  @Post('contracts/:id/terminate')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  terminateContract(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: TerminateContractDto) {
    return this.svc.terminateContract(u.tenant_id as string, u.sub, id, body);
  }

  @Post('contracts/:id/renew')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  renewContract(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: RenewContractDto) {
    return this.svc.renewContract(u.tenant_id as string, u.sub, id, body);
  }

  @Get('contracts/:id/amendments')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  amendments(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.getContractAmendments(u.tenant_id as string, id);
  }

  // ── Billing ─────────────────────────────────────────────────────

  @Get('billing/:period')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  billing(@CurrentUser() u: AuthUser, @Param('period') period: string) {
    return this.svc.getBillingSummary(u.tenant_id as string, period);
  }
}
