import { Controller, Get } from '@nestjs/common';

@Controller('talent-pool')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'talent-pool-service' };
  }
}
