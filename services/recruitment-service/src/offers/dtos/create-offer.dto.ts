import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export enum OfferStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SignatureStatus {
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
}

export class CreateOfferDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  jobId: string;

  @IsUUID()
  candidateId: string;

  @IsNumber()
  @Min(0)
  salary: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  probationDays?: number;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsString()
  offerLetterUrl?: string;

  @IsOptional()
  @IsString()
  counterNotes?: string;
}
