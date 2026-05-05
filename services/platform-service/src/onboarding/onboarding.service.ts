import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterCompanyDto } from './register-company.dto';

@Injectable()
export class OnboardingService {
  private readonly log = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto) {
    const baseSlug = this.slugify(dto.companyName);
    const slug = await this.uniqueSlug(baseSlug);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        slug,
        status: 'PENDING_APPROVAL',
        country: dto.country,
        businessEmail: dto.businessEmail,
        phone: dto.phone ?? null,
      },
    });

    const identityUrl = this.config.get<string>('IDENTITY_SERVICE_URL')?.replace(/\/$/, '');
    const internalKey = this.config.get<string>('INTERNAL_API_KEY');
    if (!identityUrl || !internalKey) {
      await this.prisma.tenant.delete({ where: { id: tenant.id } });
      throw new ServiceUnavailableException('IDENTITY_SERVICE_URL and INTERNAL_API_KEY must be configured');
    }

    let emailVerificationToken: string | undefined;
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ userId: string; emailVerificationToken: string }>(
          `${identityUrl}/api/v1/internal/provision-tenant-owner`,
          {
            email: dto.adminEmail,
            password: dto.adminPassword,
            displayName: dto.adminDisplayName,
            tenantId: tenant.id,
          },
          { headers: { 'x-internal-key': internalKey }, timeout: 15_000 },
        ),
      );
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerUserId: data.userId },
      });
      emailVerificationToken = data.emailVerificationToken;
    } catch (e: unknown) {
      await this.prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: unknown; status?: number } }).response;
        this.log.warn(`Identity provision failed: ${JSON.stringify(res?.data)}`);
        throw new BadGatewayException(res?.data ?? 'Could not create company admin account');
      }
      throw new BadGatewayException('Could not reach identity service');
    }

    const webOrigin = this.config.get<string>('WEB_APP_ORIGIN')?.replace(/\/$/, '') ?? 'http://localhost:5173';
    const devHints = this.config.get<string>('ONBOARDING_DEV_HINTS') === 'true';

    this.log.log(
      `[email stub] Verification link for ${dto.adminEmail}: ${webOrigin}/verify-email?token=${emailVerificationToken}`,
    );

    return {
      message:
        'Registration received. Check your email to verify your address. Your company will be reviewed by the platform team.',
      tenantId: tenant.id,
      slug: tenant.slug,
      access: {
        subdomainExample: `${tenant.slug}.erp.yourdomain.com`,
        pathExample: `/company/${tenant.slug}`,
      },
      ...(devHints && emailVerificationToken
        ? { devVerifyUrl: `${webOrigin}/verify-email?token=${emailVerificationToken}` }
        : {}),
    };
  }

  private slugify(name: string): string {
    let s = name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    if (s.length < 2) {
      s = `co-${Date.now().toString(36)}`;
    }
    return s;
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    for (let n = 0; n < 1000; n++) {
      const hit = await this.prisma.tenant.findUnique({ where: { slug } });
      if (!hit) return slug;
      slug = `${base}-${n + 1}`;
    }
    throw new ServiceUnavailableException('Could not allocate slug');
  }
}
