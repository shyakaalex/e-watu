import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { authUserFromJwtPayload } from './claims';

import type { AuthUser } from './auth-user';



/**

 * Validates access tokens issued by **identity-service** (HS256, shared `JWT_SECRET`).

 * Keycloak / JWKS is not used.

 */

@Injectable()

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

  constructor(config: ConfigService) {

    super({

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),

      issuer: config.getOrThrow<string>('JWT_ISSUER'),

      algorithms: ['HS256'],

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

