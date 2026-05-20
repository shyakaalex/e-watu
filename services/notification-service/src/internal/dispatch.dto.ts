import { IsEmail, IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import type { EmailTemplate } from '../email/email.service';

export class InternalDispatchDto {
  @IsIn(['email', 'in_app', 'both'])
  channel!: 'email' | 'in_app' | 'both';

  @IsOptional()
  @IsEmail()
  to?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  template?: EmailTemplate;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
