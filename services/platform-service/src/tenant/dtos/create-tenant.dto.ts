import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/** Body for creating an HR company (tenant) on the platform. EWatu §2.4 — super admin registers tenant. */
export class CreateTenantDto {
  @IsString()
  @Length(1, 200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  /**
   * URL-safe unique id, e.g. "acme-hr". Lowercase letters, numbers, single hyphens.
   */
  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase letters, numbers, and single hyphens (e.g. acme-hr)',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug!: string;

  @IsOptional()
  @IsString()
  @IsIn(['starter', 'professional', 'enterprise', 'custom'])
  plan?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'PENDING_APPROVAL',
    'ACTIVE',
    'REJECTED',
    'provisioning',
    'active',
    'suspended',
  ])
  status?: string;
}
