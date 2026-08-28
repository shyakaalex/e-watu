import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, EwatuRole, JwtAuthGuard, Roles, RolesGuard } from '@ewatu/common-auth';
import { DocumentsService } from './documents.service';

// Mounted under the already-proxied /employees/ prefix (nginx has no separate
// /documents route) as a two-segment path so it can't collide with /employees/:id.
@Controller('employees/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('all')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.MANAGING_DIRECTOR)
  list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.documents.listAll(user.tenant_id as string, search);
  }
}
