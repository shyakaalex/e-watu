import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authUserFromJwtPayload } from './claims';
import type { AuthUser } from './auth-user';
import { readJwtPemFromEnv } from './jwt-pem';

/**
 * Validates access tokens issued by **identity-service** (RS256, `JWT_PUBLIC_KEY`).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const publicKey = readJwtPemFromEnv(
      config.get<string>('JWT_PUBLIC_KEY'),
      'JWT_PUBLIC_KEY',
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      issuer: config.getOrThrow<string>('JWT_ISSUER'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: Record<string, unknown>): AuthUser {
    try {
      return authUserFromJwtPayload(payload);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
