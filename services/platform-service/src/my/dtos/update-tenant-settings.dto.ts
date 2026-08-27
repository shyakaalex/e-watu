import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  primaryColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  secondaryColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  accentColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  backgroundColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  textColor?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  baseCurrency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;
}
