import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers['x-correlation-id'] as string | undefined)?.trim() || randomUUID();

    (req as Request & { correlationId?: string }).correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    const start = Date.now();

    res.on('finish', () => {
      const log = {
        correlationId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${Date.now() - start}ms`,
        timestamp: new Date().toISOString(),
        service: process.env.SERVICE_NAME || 'unknown',
      };

      if (res.statusCode >= 500) {
        console.error(JSON.stringify(log));
      } else {
        console.log(JSON.stringify(log));
      }
    });

    next();
  }
}
