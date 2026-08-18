import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { readJwtPemFromEnv } from './jwt-pem';
import { TENANT_STATUS_KEY } from './tenant-status.decorator';

const ALWAYS_ALLOWED = new Set(['ACTIVE', 'TRIAL']);

const MESSAGES: Record<string, string> = {
  SUSPENDED: 'This company account has been suspended. Please contact your administrator.',
  EXPIRED: "This company's subscription has expired. Please renew to continue.",
  PENDING_ACTIVATION: 'This company is awaiting approval from the platform team.',
  REJECTED: "This company's registration was not approved.",
};

/**
 * Registered as a global APP_GUARD in CommonAuthModule, so it applies before any per-route
 * @UseGuards(JwtAuthGuard, ...) has run — it CANNOT rely on req.user being populated. It
 * independently verifies the bearer token (same RS256/JWT_PUBLIC_KEY/JWT_ISSUER as JwtStrategy)
 * only to read tenant_id/tenant_status; any failure (no token, invalid, expired) is treated as
 * "not this guard's concern" and passed through — actual authentication stays JwtAuthGuard's job.
 */
@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();

    const authHeader = req.headers['authorization'];
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!headerValue?.startsWith('Bearer ')) return true;

    let payload: Record<string, unknown>;
    try {
      const publicKey = readJwtPemFromEnv(this.config.get<string>('JWT_PUBLIC_KEY'), 'JWT_PUBLIC_KEY');
      payload = verify(headerValue.slice(7), publicKey, {
        algorithms: ['RS256'],
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
      }) as Record<string, unknown>;
    } catch {
      return true;
    }

    const tenantId = payload.tenant_id;
    if (typeof tenantId !== 'string' || !tenantId) return true;

    // Tokens issued before this claim existed: fail-open rather than locking everyone out.
    const status = typeof payload.tenant_status === 'string' ? payload.tenant_status : 'ACTIVE';
    if (ALWAYS_ALLOWED.has(status)) return true;

    const allowedExtra =
      this.reflector.getAllAndOverride<string[]>(TENANT_STATUS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (allowedExtra.includes(status)) return true;

    throw new ForbiddenException({
      code: `TENANT_${status}`,
      message: MESSAGES[status] ?? 'This company account cannot access this resource right now.',
    });
  }
}
