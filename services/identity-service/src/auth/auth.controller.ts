import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AllowTenantStatus, JwtAuthGuard } from '@ewatu/common-auth';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { LogoutDto } from './dtos/logout.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @SkipThrottle()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @SkipThrottle()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @SkipThrottle()
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @AllowTenantStatus('SUSPENDED', 'EXPIRED', 'PENDING_ACTIVATION', 'REJECTED')
  @Post('logout')
  logout(@Body() body: LogoutDto) {
    return this.auth.logout(body.refreshToken);
  }

  @SkipThrottle()
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.auth.verifyEmail(body.token);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  @SkipThrottle()
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.newPassword);
  }
}
