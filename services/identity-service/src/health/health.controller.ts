import { Controller, Get } from '@nestjs/common';

@Controller('identity')
export class HealthController {
  @Get('health')
  health() {
    return { service: 'identity-service', status: 'ok' };
  }
}
