import { Module } from '@nestjs/common';
import { InternalApiGuard } from '../internal/internal-api.guard';
import { InternalPresignController } from './internal-presign.controller';
import { PresignController } from './presign.controller';
import { PresignService } from './presign.service';
import { S3BootstrapService } from './s3-bootstrap.service';

@Module({
  controllers: [PresignController, InternalPresignController],
  providers: [S3BootstrapService, PresignService, InternalApiGuard],
})
export class PresignModule {}
