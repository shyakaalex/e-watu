import { IsOptional, IsString, Length } from 'class-validator';

export class RejectTenantDto {
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  reason?: string;
}
