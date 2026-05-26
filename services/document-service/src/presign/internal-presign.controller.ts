import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from '../internal/internal-api.guard';
import { InternalPresignDto } from './dto/internal-presign.dto';
import { PresignService } from './presign.service';

@Controller('document/internal')
@UseGuards(InternalApiGuard)
export class InternalPresignController {
  constructor(private readonly presign: PresignService) {}

  @Post('presign')
  create(@Body() body: InternalPresignDto) {
    return this.presign.createPresignedPutForTenant(body.tenantId, {
      objectKey: body.objectKey,
      contentType: body.contentType,
      fileSize: body.fileSize,
    });
  }
}
