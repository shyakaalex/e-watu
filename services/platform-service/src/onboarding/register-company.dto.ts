import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

/** Public company + owner registration (tenant stays PENDING_APPROVAL until super admin approves). */
export class RegisterCompanyDto {
  @IsString()
  @Length(2, 200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName!: string;

  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  businessEmail!: string;

  @IsString()
  @Length(5, 32)
  @Matches(/^[+0-9()\-\s]{5,32}$/, {
    message: 'phone must be a valid phone number',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  country!: string;

  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  adminEmail!: string;

  @IsString()
  @MinLength(10)
  adminPassword!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  adminDisplayName?: string;
}
