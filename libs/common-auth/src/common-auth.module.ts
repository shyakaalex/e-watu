import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { TenantStatusGuard } from './tenant-status.guard';

@Global()
@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  // Reflector: required so RolesGuard resolves when @ewatu/common-auth is a linked file dependency
  // (avoids a second @nestjs/core DI graph in some npm layouts).
  providers: [
    Reflector,
    JwtStrategy,
    RolesGuard,
    TenantStatusGuard,
    { provide: APP_GUARD, useClass: TenantStatusGuard },
    // See all-exceptions.filter.ts: works around each package resolving its own @nestjs/common
    // copy, which breaks Nest's default `instanceof HttpException` exception handling for
    // anything thrown from this shared lib (TenantStatusGuard, RolesGuard, PermissionsGuard).
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  exports: [PassportModule, Reflector, RolesGuard, TenantStatusGuard],
})
export class CommonAuthModule {}
