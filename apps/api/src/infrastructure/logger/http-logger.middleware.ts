import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Generate or use existing request ID for distributed tracing
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    
    // Add request ID to response header for client correlation
    res.setHeader('X-Request-ID', requestId);

    // Attach request ID to request object for easy access
    (req as any).requestId = requestId;

    // Log incoming request
    this.logger.logRequest(req);

    // Capture response
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.logger.logResponse(req, res, responseTime);
    });

    next();
  }
}

