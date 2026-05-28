import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { PayslipService } from './payslip.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipController {
  constructor(private readonly service: PayslipService) {}

  @Get('payslips/:employeeId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER, EwatuRole.CLIENT_ADMIN)
  getEmployeePayslips(@CurrentUser() user: AuthUser, @Param('employeeId') employeeId: string) {
    return this.service.getEmployeePayslips(user.tenant_id as string, employeeId);
  }

  @Get('periods/:id/payslips')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  getPeriodPayslips(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getPeriodPayslips(user.tenant_id as string, id);
  }
}
