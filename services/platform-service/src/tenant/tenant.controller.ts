import {

  Body,

  Controller,

  Get,

  Param,

  Patch,

  Post,

  UseGuards,

} from '@nestjs/common';

import {

  EwatuRole,

  JwtAuthGuard,

  Roles,

  RolesGuard,

} from '@ewatu/common-auth';

import { CreateTenantDto } from './dtos/create-tenant.dto';

import { RejectTenantDto } from './dtos/reject-tenant.dto';

import { TenantService } from './tenant.service';



@Controller('tenants')

export class TenantController {

  constructor(private readonly tenant: TenantService) {}



  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles(EwatuRole.PLATFORM_SUPER_ADMIN)

  @Get()

  list() {

    return this.tenant.findAll();

  }



  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles(EwatuRole.PLATFORM_SUPER_ADMIN)

  @Get('pending')

  listPending() {

    return this.tenant.findPending();

  }



  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles(EwatuRole.PLATFORM_SUPER_ADMIN)

  @Post()

  create(@Body() body: CreateTenantDto) {

    return this.tenant.create(body);

  }



  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles(EwatuRole.PLATFORM_SUPER_ADMIN)

  @Patch(':id/approve')

  approve(@Param('id') id: string) {

    return this.tenant.approve(id);

  }



  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles(EwatuRole.PLATFORM_SUPER_ADMIN)

  @Patch(':id/reject')

  reject(@Param('id') id: string, @Body() body: RejectTenantDto) {

    return this.tenant.reject(id, body.reason);

  }

}

