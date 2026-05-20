import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicApplyDto, PublicTalentPoolDto } from './dtos/public-apply.dto';
import { PublicService } from './public.service';

/** Public careers portal — no authentication (EWatu §3.2). */
@Controller('public')
export class PublicController {
  constructor(private readonly pub: PublicService) {}

  @Get(':slug/jobs')
  listJobs(@Param('slug') slug: string) {
    return this.pub.listOpenJobs(slug);
  }

  @Post(':slug/jobs/:jobId/apply')
  apply(
    @Param('slug') slug: string,
    @Param('jobId') jobId: string,
    @Body() body: PublicApplyDto,
  ) {
    return this.pub.applyToJob(slug, jobId, body);
  }

  @Post(':slug/talent-pool')
  talentPool(@Param('slug') slug: string, @Body() body: PublicTalentPoolDto) {
    return this.pub.joinTalentPool(slug, body);
  }
}
