import { Module } from '@nestjs/common';
import { PresignController } from './presign.controller';
import { PresignService } from './presign.service';
import { S3BootstrapService } from './s3-bootstrap.service';

@Module({
  controllers: [PresignController],
  providers: [S3BootstrapService, PresignService],
})
export class PresignModule {}
