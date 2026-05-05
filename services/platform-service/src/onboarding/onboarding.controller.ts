import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { RegisterCompanyDto } from './register-company.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('register')
  register(@Body() body: RegisterCompanyDto) {
    return this.onboarding.registerCompany(body);
  }
}
