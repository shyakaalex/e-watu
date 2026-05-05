import { Controller, Get } from '@nestjs/common';

@Controller('document')
export class HealthController {
  @Get('health')
  health() {
    return { service: 'document-service', status: 'ok', spec: 'S3 / MinIO presigned uploads' };
  }
}
