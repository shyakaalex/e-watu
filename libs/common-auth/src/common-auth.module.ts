import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  // Reflector: required so RolesGuard resolves when @ewatu/common-auth is a linked file dependency
  // (avoids a second @nestjs/core DI graph in some npm layouts).
  providers: [Reflector, JwtStrategy, RolesGuard],
  exports: [PassportModule, Reflector, RolesGuard],
})
export class CommonAuthModule {}
