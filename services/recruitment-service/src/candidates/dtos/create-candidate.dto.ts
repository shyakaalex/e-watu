import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
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

export enum ContactPreference {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  LINKEDIN = 'LINKEDIN',
}

export enum EmploymentStatus {
  EMPLOYED = 'EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
  FREELANCE = 'FREELANCE',
  STUDENT = 'STUDENT',
}

export enum Availability {
  IMMEDIATE = 'IMMEDIATE',
  FROM_DATE = 'FROM_DATE',
  PASSIVE = 'PASSIVE',
}

export enum CandidateStatus {
  ACTIVE = 'ACTIVE',
  IN_PIPELINE = 'IN_PIPELINE',
  PLACED = 'PLACED',
  PASSIVE = 'PASSIVE',
  DO_NOT_CONTACT = 'DO_NOT_CONTACT',
  ARCHIVED = 'ARCHIVED',
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

  // --- new fields ---

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(ContactPreference)
  contactPreference?: ContactPreference;

  @IsOptional()
  @IsString()
  communicationLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentEmployer?: string;

  @IsOptional()
  @IsNumber()
  yearsExperience?: number;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsNumber()
  salaryExpMin?: number;

  @IsOptional()
  @IsNumber()
  salaryExpMax?: number;

  @IsOptional()
  @IsString()
  salaryCurrency?: string = 'RWF';

  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;
}
