import { Controller, Get } from '@nestjs/common';

@Controller('procurement')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'procurement-service' };
  }
}
