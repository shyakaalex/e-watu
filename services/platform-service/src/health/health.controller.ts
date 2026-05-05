import { Controller, Get } from '@nestjs/common';

@Controller('platform')
export class HealthController {
  @Get('health')
  health() {
    return {
      service: 'platform-service',
      status: 'ok',
      spec: 'EWatu Phase 1 — tenant registry',
    };
  }
}
