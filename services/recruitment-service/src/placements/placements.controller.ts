import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreatePlacementDto, InvoiceStatus } from './dtos/create-placement.dto';
import { PlacementsService } from './placements.service';

class UpdateInvoiceDto {
  @IsEnum(InvoiceStatus)
  invoiceStatus: InvoiceStatus;
}

@Controller('placements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlacementsController {
  constructor(private readonly placements: PlacementsService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  list(
    @CurrentUser() user: AuthUser,
    @Query('jobId') jobId?: string,
    @Query('candidateId') candidateId?: string,
  ) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.findAll(tid, { jobId, candidateId });
  }

  @Get('metrics/:consultantId')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  metrics(
    @CurrentUser() user: AuthUser,
    @Param('consultantId') consultantId: string,
  ) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.consultantMetrics(tid, consultantId);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.findOne(tid, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePlacementDto) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.create(tid, body);
  }

  @Patch(':id/invoice')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.FINANCE_OFFICER)
  updateInvoice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateInvoiceDto,
  ) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.updateInvoiceStatus(tid, id, body.invoiceStatus);
  }
}
