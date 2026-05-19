import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateOfferDto, SignatureStatus } from './create-offer.dto';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  @IsOptional()
  @IsEnum(SignatureStatus)
  signatureStatus?: SignatureStatus;
}
