import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignService } from './presign.service';

@Controller('document')
export class PresignController {
  constructor(private readonly presign: PresignService) {}

  /**
   * Returns a time-limited URL to upload one object via HTTP PUT.
   * Caller must be PLATFORM_SUPER_ADMIN, or TENANT_ADMIN with `tenant_id` claim matching body.tenantId.
   */
  @UseGuards(JwtAuthGuard)
  @Post('presign')
  create(@CurrentUser() user: AuthUser, @Body() body: PresignUploadDto) {
    return this.presign.createPresignedPut(user, body);
  }
}
