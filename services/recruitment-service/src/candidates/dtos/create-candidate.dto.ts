import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export enum CandidateSource {
  REFERRAL = 'REFERRAL',
  JOB_BOARD = 'JOB_BOARD',
  DIRECT = 'DIRECT',
  AGENCY = 'AGENCY',
  OTHER = 'OTHER',
}

export class CreateCandidateDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  currentTitle?: string;

  @IsOptional()
  @IsEnum(CandidateSource)
  source?: CandidateSource;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
