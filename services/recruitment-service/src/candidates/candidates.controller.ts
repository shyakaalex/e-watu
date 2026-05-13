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
import { CreateCandidateDto } from './dtos/create-candidate.dto';
import { UpdateCandidateDto } from './dtos/update-candidate.dto';
import { CandidatesService } from './candidates.service';

@Controller('candidates')
@UseGuards(JwtAuthGuard)
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.findAll(tid, q);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.findOne(tid, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateCandidateDto) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.create(tid, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateCandidateDto,
  ) {
    const tid = this.candidates.requireTenant(user.tenant_id);
    return this.candidates.update(tid, id, body);
  }
}
