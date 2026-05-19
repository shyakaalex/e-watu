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
import { AuthUser, CurrentUser, JwtAuthGuard } from '@ewatu/common-auth';
import { CreateOfferDto } from './dtos/create-offer.dto';
import { UpdateOfferDto } from './dtos/update-offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('jobId') jobId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('status') status?: string,
  ) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.findAll(tid, { jobId, candidateId, status });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.findOne(tid, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateOfferDto) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.create(tid, body, user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateOfferDto,
  ) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.update(tid, id, body);
  }
}
