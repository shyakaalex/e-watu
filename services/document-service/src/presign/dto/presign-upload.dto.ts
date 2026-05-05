import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength, Matches } from 'class-validator';

export class PresignUploadDto {
  @IsUUID('4')
  tenantId: string;

  /** Relative path under tenants/{tenantId}/, e.g. branding/logo.png */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^(?!\/)(?!.*\.\.)([a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/, {
    message: 'objectKey: use a safe path like folder/file.png (no .. or leading /)',
  })
  objectKey: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contentType: string;
}
