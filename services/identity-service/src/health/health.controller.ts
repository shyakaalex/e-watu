import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('identity')
export class HealthController {
  @Get('health')
  health() {
    return { service: 'identity-service', status: 'ok' };
  }
}
