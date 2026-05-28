import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('payroll/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('paye')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  async paye(@CurrentUser() user: AuthUser, @Query('periodId') periodId: string, @Res() res: Response) {
    const csv = await this.service.generatePAYEReport(user.tenant_id as string, periodId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="paye-report.csv"');
    res.send(csv);
  }

  @Get('rssb')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  async rssb(@CurrentUser() user: AuthUser, @Query('periodId') periodId: string, @Res() res: Response) {
    const csv = await this.service.generateRSSBReport(user.tenant_id as string, periodId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rssb-report.csv"');
    res.send(csv);
  }

  @Get('summary')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  summary(
    @CurrentUser() user: AuthUser,
    @Query('clientId') clientId: string,
    @Query('year') year: string,
  ) {
    return this.service.generateSummaryReport(user.tenant_id as string, clientId, Number.parseInt(year, 10));
  }

  @Get('bank-file/:periodId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  async bankFile(
    @CurrentUser() user: AuthUser,
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const csv = await this.service.generateBankFile(user.tenant_id as string, periodId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bank-file.csv"');
    res.send(csv);
  }
}
