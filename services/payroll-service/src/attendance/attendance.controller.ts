import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard, RolesGuard } from '@ewatu/common-auth';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('clock-in')
  clockIn(@CurrentUser() user: AuthUser) {
    return this.service.clockIn(user.tenant_id as string, user.email);
  }

  @Post('clock-out')
  clockOut(@CurrentUser() user: AuthUser) {
    return this.service.clockOut(user.tenant_id as string, user.email);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listMine(user.tenant_id as string, user.email);
  }
}
