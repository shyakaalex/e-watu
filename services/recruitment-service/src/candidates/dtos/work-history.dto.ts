import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWorkHistoryDto {
  @IsString()
  @MaxLength(200)
  employer: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  responsibilities?: string;
}

export class CreateEducationDto {
  @IsString()
  @MaxLength(200)
  institution: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;
}

export enum LanguageProficiency {
  NATIVE = 'NATIVE',
  FLUENT = 'FLUENT',
  CONVERSATIONAL = 'CONVERSATIONAL',
  BASIC = 'BASIC',
}

export class CreateLanguageDto {
  @IsString()
  language: string;

  @IsEnum(LanguageProficiency)
  proficiency: LanguageProficiency;
}

export enum DocumentLabel {
  CV = 'CV',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER',
}

export class CreateDocumentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileKey: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsEnum(DocumentLabel)
  label?: DocumentLabel;
}
