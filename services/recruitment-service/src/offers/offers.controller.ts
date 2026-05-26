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
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreateOfferDto } from './dtos/create-offer.dto';
import { RejectOfferDto } from './dtos/reject-offer.dto';
import { UpdateOfferDto } from './dtos/update-offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  @Roles(
    EwatuRole.TENANT_ADMIN,
    EwatuRole.HR_MANAGER,
    EwatuRole.RECRUITER,
    EwatuRole.CLIENT_ADMIN,
  )
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
  @Roles(
    EwatuRole.TENANT_ADMIN,
    EwatuRole.HR_MANAGER,
    EwatuRole.RECRUITER,
    EwatuRole.CLIENT_ADMIN,
  )
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.findOne(tid, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateOfferDto) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.create(tid, body, user.sub);
  }

  @Patch(':id/send')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.sendOffer(id, tid);
  }

  @Patch(':id/accept')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.acceptOffer(id, tid);
  }

  @Patch(':id/reject')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: RejectOfferDto,
  ) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.rejectOffer(id, tid, body.rejectionReason);
  }

  @Patch(':id/withdraw')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  withdraw(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.withdrawOffer(id, tid);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateOfferDto,
  ) {
    const tid = this.offers.requireTenant(user.tenant_id);
    return this.offers.update(tid, id, body);
  }
}
