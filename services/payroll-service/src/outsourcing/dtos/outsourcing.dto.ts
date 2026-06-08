import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum DeploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  RECALLED = 'RECALLED',
  TRANSFERRED = 'TRANSFERRED',
  ON_BENCH = 'ON_BENCH',
}

export enum OutsourcingEmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  FIXED_TERM = 'FIXED_TERM',
}

export enum SecondmentContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED',
}

export class CreateAssignmentDto {
  @IsString() employeeId: string;
  @IsString() clientName: string;
  @IsOptional() @IsString() clientId?: string;
  @IsString() roleName: string;
  @IsOptional() @IsString() deploymentSite?: string;
  @IsEnum(OutsourcingEmploymentType) @IsOptional() employmentType?: OutsourcingEmploymentType;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsNumber() monthlyFee?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsInt() @Min(0) noticePeriodDays?: number;
}

export class UpdateAssignmentDto {
  @IsOptional() @IsString() clientName?: string;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() roleName?: string;
  @IsOptional() @IsString() deploymentSite?: string;
  @IsOptional() @IsEnum(OutsourcingEmploymentType) employmentType?: OutsourcingEmploymentType;
  @IsOptional() @IsEnum(DeploymentStatus) deploymentStatus?: DeploymentStatus;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() availabilityDate?: string;
  @IsOptional() @IsNumber() monthlyFee?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsInt() @Min(0) noticePeriodDays?: number;
  @IsOptional() @IsString() transferReason?: string;
}

export class CreateContractDto {
  @IsString() assignmentId: string;
  @IsOptional() @IsString() contractRef?: string;
  @IsString() clientName: string;
  @IsString() role: string;
  @IsNumber() billingRate: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsInt() @Min(0) workingHoursPerWeek?: number;
  @IsOptional() @IsInt() @Min(0) noticePeriodDays?: number;
  @IsOptional() @IsString() governingLaw?: string;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() renewalDate?: string;
}

export class UpdateContractDto {
  @IsOptional() @IsString() contractRef?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsNumber() billingRate?: number;
  @IsOptional() @IsInt() @Min(0) workingHoursPerWeek?: number;
  @IsOptional() @IsInt() @Min(0) noticePeriodDays?: number;
  @IsOptional() @IsString() governingLaw?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsDateString() renewalDate?: string;
  @IsOptional() @IsString() amendmentReason?: string;
}

export class TerminateContractDto {
  @IsString() reason: string;
  @IsOptional() @IsDateString() terminationDate?: string;
}

export class RenewContractDto {
  @IsDateString() newEndDate: string;
  @IsOptional() @IsDateString() renewalDate?: string;
  @IsOptional() @IsNumber() billingRate?: number;
  @IsOptional() @IsString() notes?: string;
}
