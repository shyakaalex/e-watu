import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';

@Controller('procurement/vendors')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  @RequirePermissions('procurement:*')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVendorDto) {
    return this.vendorsService.create(user.tenant_id as string, user.sub, dto);
  }

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  @RequirePermissions('procurement:*')
  findAll(@CurrentUser() user: AuthUser) {
    return this.vendorsService.findAll(user.tenant_id as string);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  @RequirePermissions('procurement:*')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vendorsService.findOne(user.tenant_id as string, id);
  }
}
