import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ApplicationSource {
  E_WATU_PORTAL = 'E_WATU_PORTAL',
  WEBSITE = 'WEBSITE',
  MANUAL = 'MANUAL',
  REFERRAL = 'REFERRAL',
  LINKEDIN = 'LINKEDIN',
  WALK_IN = 'WALK_IN',
  IMPORT = 'IMPORT',
}

export class CreateApplicationDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  candidateId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ApplicationSource)
  source?: ApplicationSource;
}
