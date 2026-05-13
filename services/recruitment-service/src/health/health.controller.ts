import { Controller, Get } from '@nestjs/common';

@Controller('recruitment/health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'recruitment-service' };
  }
}
