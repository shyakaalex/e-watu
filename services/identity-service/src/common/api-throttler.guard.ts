import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const skipFromDecorators = await super.shouldSkip(context);
    if (skipFromDecorators) return true;

    const { req } = this.getRequestResponse(context);
    const method = String(req?.method ?? '').toUpperCase();
    const path = String(req?.url ?? '');

    // /me is used by layout hydration on most screens; do not rate-limit it.
    if (method === 'GET' && (path === '/api/v1/me' || path.endsWith('/api/v1/me'))) {
      return true;
    }

    return false;
  }
}
