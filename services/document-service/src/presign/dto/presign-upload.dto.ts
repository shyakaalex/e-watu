import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';

export class PresignUploadDto {
  /**
   * Relative path under tenants/{tenantId}/.
   * Examples: candidates/{uuid}/cv-filename.pdf, offers/{uuid}/offer-letter.pdf, branding/logo.png
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^(?!\/)(?!.*\.\.)([a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/, {
    message: 'objectKey: use a safe path like folder/file.png (no .. or leading /)',
  })
  objectKey!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contentType!: string;

  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024)
  fileSize!: number;
}
