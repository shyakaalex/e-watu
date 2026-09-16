import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import type { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceNetworkPolicyDto } from './dtos/update-network-policy.dto';
import { normalizeIp } from './ip-network.util';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('clock-in')
  clockIn(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.service.clockIn(user.tenant_id as string, user.email, req.ip);
  }

  @Post('clock-out')
  clockOut(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.service.clockOut(user.tenant_id as string, user.email, req.ip);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listMine(user.tenant_id as string, user.email);
  }

  @Get('network-policy')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.MANAGING_DIRECTOR)
  async getNetworkPolicy(@CurrentUser() user: AuthUser, @Req() req: Request) {
    const policy = await this.service.getNetworkPolicy(user.tenant_id as string);
    // Surfaced so an admin setting this up from the office can one-click add their own IP.
    return { ...policy, callerIp: req.ip ? normalizeIp(req.ip) : null };
  }

  @Put('network-policy')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.MANAGING_DIRECTOR)
  updateNetworkPolicy(@CurrentUser() user: AuthUser, @Body() dto: UpdateAttendanceNetworkPolicyDto) {
    return this.service.updateNetworkPolicy(user.tenant_id as string, dto, user.email);
  }
}
