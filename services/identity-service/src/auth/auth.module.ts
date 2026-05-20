// Generate RS256 keys with:
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem
// Paste PEM contents into JWT_PRIVATE_KEY / JWT_PUBLIC_KEY in .env (use \n for newlines).

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { readJwtPemFromEnv } from '@ewatu/common-auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const privateKey = readJwtPemFromEnv(
          config.get<string>('JWT_PRIVATE_KEY'),
          'JWT_PRIVATE_KEY',
        );
        return {
          privateKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
            issuer: config.getOrThrow<string>('JWT_ISSUER'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService],
  exports: [AuthService],
})
export class AuthModule {}
