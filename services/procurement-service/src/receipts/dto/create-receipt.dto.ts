import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReceiptDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;
}
