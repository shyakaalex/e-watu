import { ArrayMaxSize, IsArray, IsBoolean, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isValidCidr } from '../ip-network.util';

@ValidatorConstraint({ name: 'isCidrList', async: false })
class IsCidrListConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return Array.isArray(value) && value.every((v) => typeof v === 'string' && isValidCidr(v));
  }
  defaultMessage(): string {
    return 'allowedCidrs must be valid IPv4 addresses or CIDR ranges, e.g. "41.186.12.4" or "41.186.12.0/24"';
  }
}

export class UpdateAttendanceNetworkPolicyDto {
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ArrayMaxSize(20)
  @Validate(IsCidrListConstraint)
  allowedCidrs!: string[];
}
