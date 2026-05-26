import { IsOptional, IsString } from 'class-validator';

export class RejectOfferDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
