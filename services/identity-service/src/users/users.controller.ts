import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

@SkipThrottle()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EwatuRole.TENANT_ADMIN, EwatuRole.PLATFORM_SUPER_ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.users.listForTenant(user);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateUserDto) {
    return this.users.createForTenant(user, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.users.updateForTenant(user, id, body);
  }
}
