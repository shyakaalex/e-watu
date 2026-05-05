import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ProvisionTenantOwnerDto } from './dtos/provision-tenant-owner.dto';
import { InternalApiGuard } from './internal-api.guard';

@Controller('internal')
@UseGuards(InternalApiGuard)
export class InternalController {
  constructor(private readonly auth: AuthService) {}

  @Post('provision-tenant-owner')
  provisionTenantOwner(@Body() body: ProvisionTenantOwnerDto) {
    return this.auth.provisionTenantOwner(body);
  }
}
