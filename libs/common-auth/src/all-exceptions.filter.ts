import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

interface HttpLikeException {
  getStatus: () => number;
  getResponse: () => unknown;
}

/**
 * Nest's built-in exception handling checks `exception instanceof HttpException`. In this
 * monorepo, `libs/common-auth` and each service resolve their OWN separate copy of
 * `@nestjs/common` (confirmed via `node_modules` inspection — not a hoisted single install),
 * so an exception thrown by shared-lib code (e.g. TenantStatusGuard, RolesGuard) is a DIFFERENT
 * class instance than the one a service's own exception handling checks against — the
 * `instanceof` check silently fails and Nest falls back to a generic 500.
 *
 * This filter duck-types instead: any exception exposing `getStatus()`/`getResponse()` (which
 * every HttpException subclass does, regardless of which copy of the class constructed it) is
 * treated as an HTTP exception and formatted accordingly. Registered globally via APP_FILTER in
 * CommonAuthModule so every service picks it up automatically.
 */
function isHttpLikeException(exception: unknown): exception is HttpLikeException {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    typeof (exception as Record<string, unknown>).getStatus === 'function' &&
    typeof (exception as Record<string, unknown>).getResponse === 'function'
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (isHttpLikeException(exception)) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === 'string' ? { statusCode: status, message: body } : body,
      );
      return;
    }

    this.log.error(exception instanceof Error ? exception.stack : exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
