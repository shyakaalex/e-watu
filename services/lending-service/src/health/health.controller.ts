import { Controller, Get } from '@nestjs/common';

@Controller('lending')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'lending-service' };
  }
}
