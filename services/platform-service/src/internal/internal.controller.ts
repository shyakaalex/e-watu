import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from './internal-api.guard';
import { TenantService } from '../tenant/tenant.service';

@Controller('internal')
@UseGuards(InternalApiGuard)
export class InternalController {
  constructor(private readonly tenant: TenantService) {}

  @Patch('tenants/:tenantId/email-verified')
  markEmailVerified(@Param('tenantId') tenantId: string) {

    return this.tenant.markOwnerEmailVerified(tenantId);

  }

}

