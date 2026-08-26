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
import { EmployeesService } from '../employees/employees.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipController {
  constructor(
    private readonly service: PayslipService,
    private readonly employees: EmployeesService,
  ) {}

  /** No @Roles guard — self-service: an employee may see their own payslips. */
  @Get('payslips/me')
  async getMine(@CurrentUser() user: AuthUser) {
    const me = await this.employees.findMyRecord(user.tenant_id as string, user.email as string);
    return this.service.getEmployeePayslips(user.tenant_id as string, me.id);
  }

  @Get('payslips/:employeeId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  getEmployeePayslips(@CurrentUser() user: AuthUser, @Param('employeeId') employeeId: string) {
    return this.service.getEmployeePayslips(user.tenant_id as string, employeeId);
  }

  @Get('periods/:id/payslips')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  getPeriodPayslips(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getPeriodPayslips(user.tenant_id as string, id);
  }
}
