import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignService } from './presign.service';

@Controller('document')
export class PresignController {
  constructor(private readonly presign: PresignService) {}

  /**
   * Returns a time-limited URL to upload one object via HTTP PUT.
   * Tenant scope comes from JWT `tenant_id` only (not the request body).
   */
  @UseGuards(JwtAuthGuard)
  @Post('presign')
  create(@CurrentUser() user: AuthUser, @Body() body: PresignUploadDto) {
    return this.presign.createPresignedPut(user, body);
  }
}
