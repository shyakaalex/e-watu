import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
  EwatuRole,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@ewatu/common-auth';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dtos/create-employee.dto';
import { CreateEmployeeFromPlacementDto } from './dtos/create-employee-from-placement.dto';
import { UpdateEmployeeDto } from './dtos/update-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.employees.findAll(user.tenant_id as string, query);
  }

  @Get(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER, EwatuRole.FINANCE_OFFICER)
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.employees.findOne(user.tenant_id as string, id);
  }

  @Post()
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateEmployeeDto) {
    return this.employees.create(user.tenant_id as string, body);
  }

  @Post('from-placement')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  createFromPlacement(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateEmployeeFromPlacementDto,
  ) {
    return this.employees.createFromPlacement(user, body);
  }

  @Patch(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateEmployeeDto) {
    return this.employees.update(user.tenant_id as string, id, body);
  }

  @Delete(':id')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  terminate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.employees.terminate(user.tenant_id as string, id);
  }

  @Post(':id/convert')
  @Roles(EwatuRole.TENANT_ADMIN, EwatuRole.HR_MANAGER)
  convert(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      placementId?: string;
      candidateData?: { firstName?: string; lastName?: string; email?: string; phone?: string };
    },
  ) {
    return this.employees.convertFromPlacement(user.tenant_id as string, id, body);
  }
}
