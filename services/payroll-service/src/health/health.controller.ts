import { Controller, Get } from '@nestjs/common';

@Controller('payroll')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'payroll-service' };
  }
}
