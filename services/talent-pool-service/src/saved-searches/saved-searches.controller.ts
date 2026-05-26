import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { CreateSearchDto } from './dto/create-search.dto';
import { SavedSearchesService } from './saved-searches.service';

@Controller('saved-searches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SavedSearchesController {
  constructor(private readonly searches: SavedSearchesService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  list(@CurrentUser() user: AuthUser) {
    const tid = this.searches.requireTenant(user.tenant_id);
    return this.searches.findAll(tid);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateSearchDto) {
    const tid = this.searches.requireTenant(user.tenant_id);
    return this.searches.create(tid, body);
  }

  @Delete(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.searches.requireTenant(user.tenant_id);
    return this.searches.remove(tid, id);
  }

  @Post(':id/run')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.RECRUITER)
  run(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.searches.requireTenant(user.tenant_id);
    return this.searches.run(tid, id);
  }
}
