import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  PAID = 'PAID',
}

export class CreatePlacementDto {
  @IsUUID()
  offerId: string;

  @IsUUID()
  jobId: string;

  @IsUUID()
  candidateId: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  clientName?: string;

  @IsString()
  @MaxLength(200)
  roleName: string;

  @IsString()
  startDate: string;

  @IsNumber()
  @Min(0)
  salary: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  reportingLine?: string;

  @IsOptional()
  @IsString()
  consultantId?: string;
}
