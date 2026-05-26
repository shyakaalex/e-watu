import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, MaxLength, Min, MinLength, Matches } from 'class-validator';

export class InternalPresignDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^(?!\/)(?!.*\.\.)([a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/, {
    message: 'objectKey: use a safe path like candidates/uuid/cv.pdf',
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
