import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EwatuRole } from '@ewatu/common-auth';
import { PrismaService } from '../prisma/prisma.service';
import { generateRawToken, hashToken } from '../common/token-hash';
import { RefreshTokenService } from './refresh-token.service';
import type { LoginDto } from './dtos/login.dto';
import type { RegisterDto } from './dtos/register.dto';
import type { ProvisionTenantOwnerDto } from '../internal/dtos/provision-tenant-owner.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  /** First user only → platform super admin (bootstrap). Everyone else must use company onboarding. */
  async register(dto: RegisterDto) {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new ForbiddenException({
        message: 'Open registration is disabled. Register your company at /register-company.',
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName?.trim() || null,
        roles: [EwatuRole.PLATFORM_SUPER_ADMIN],
        emailVerified: true,
      },
    });

    const refreshToken = await this.refreshTokens.generateRefreshToken(user.id, user.tenantId);
    return {
      access_token: this.signAccessToken(user),
      refresh_token: refreshToken,
      token_type: 'Bearer' as const,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.active) {
      throw new UnauthorizedException('This account has been deactivated');
    }
    if (!user.emailVerified && !user.roles.includes(EwatuRole.PLATFORM_SUPER_ADMIN)) {
      throw new UnauthorizedException(
        'Please verify your email first. Use the link we sent after company registration.',
      );
    }

    const refreshToken = await this.refreshTokens.generateRefreshToken(user.id, user.tenantId);
    return {
      access_token: this.signAccessToken(user),
      refresh_token: refreshToken,
      token_type: 'Bearer' as const,
    };
  }

  async refresh(rawRefreshToken: string) {
    const { userId } = await this.refreshTokens.validateAndRotate(rawRefreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshToken = await this.refreshTokens.generateRefreshToken(user.id, user.tenantId);
    return {
      access_token: this.signAccessToken(user),
      refresh_token: refreshToken,
      token_type: 'Bearer' as const,
    };
  }

  async logout(rawRefreshToken: string) {
    await this.refreshTokens.revokeByRawToken(rawRefreshToken);
    return { success: true };
  }

  async verifyEmail(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token required');
    }
    const hashedIncoming = hashToken(token.trim());
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: hashedIncoming },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });
    if (user.tenantId) {
      await this.notifyPlatformEmailVerified(user.tenantId);
    }
    return { verified: true };
  }

  async provisionTenantOwner(dto: ProvisionTenantOwnerDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const rawVerificationToken = generateRawToken(32);
    const emailVerificationToken = hashToken(rawVerificationToken);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName?.trim() || null,
        roles: [EwatuRole.TENANT_ADMIN],
        tenantId: dto.tenantId,
        emailVerified: false,
        emailVerificationToken,
      },
    });

    return { userId: user.id, emailVerificationToken: rawVerificationToken };
  }

  private async notifyPlatformEmailVerified(tenantId: string) {
    const base = this.config.get<string>('PLATFORM_SERVICE_URL')?.replace(/\/$/, '');
    const key = this.config.get<string>('INTERNAL_API_KEY');
    if (!base || !key) return;
    try {
      await fetch(`${base}/api/v1/internal/tenants/${tenantId}/email-verified`, {
        method: 'PATCH',
        headers: { 'x-internal-key': key },
      });
    } catch {
      // non-fatal
    }
  }

  private signAccessToken(user: {
    id: string;
    email: string;
    displayName: string | null;
    roles: string[];
    tenantId: string | null;
    emailVerified: boolean;
  }) {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    return this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        preferred_username: user.displayName ?? user.email.split('@')[0],
        roles: user.roles,
        tenant_id: user.tenantId ?? undefined,
        email_verified: user.emailVerified,
      },
      { expiresIn },
    );
  }
}
