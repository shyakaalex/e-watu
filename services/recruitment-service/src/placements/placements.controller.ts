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
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
import { CreatePlacementDto, InvoiceStatus } from './dtos/create-placement.dto';
import { PlacementsService } from './placements.service';

class UpdateInvoiceDto {
  @IsEnum(InvoiceStatus)
  invoiceStatus: InvoiceStatus;
}

@Controller('placements')
@UseGuards(JwtAuthGuard)
export class PlacementsController {
  constructor(private readonly placements: PlacementsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('jobId') jobId?: string,
    @Query('candidateId') candidateId?: string,
  ) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.findAll(tid, { jobId, candidateId });
  }

  @Get('metrics/:consultantId')
  metrics(
    @CurrentUser() user: AuthUser,
    @Param('consultantId') consultantId: string,
  ) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.consultantMetrics(tid, consultantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.findOne(tid, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePlacementDto) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.create(tid, body);
  }

  @Patch(':id/invoice')
  updateInvoice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateInvoiceDto,
  ) {
    const tid = this.placements.requireTenant(user.tenant_id);
    return this.placements.updateInvoiceStatus(tid, id, body.invoiceStatus);
  }
}
