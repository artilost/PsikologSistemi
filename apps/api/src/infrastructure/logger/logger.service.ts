import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as pino from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogContext {
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  requestId?: string;
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: pino.Logger;
  private context?: string;

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get<string>('app.nodeEnv') === 'development';
    const logLevel = this.configService.get<string>('log.level', 'info');

    this.logger = pino.pino({
      level: logLevel,
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          }
        : undefined,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      base: {
        env: this.configService.get<string>('app.nodeEnv'),
      },
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: LogContext) {
    this.info(message, context);
  }

  info(message: string, context?: LogContext) {
    this.logger.info(this.mergeContext(context), message);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(this.mergeContext({ ...context, trace }), message);
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(this.mergeContext(context), message);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(this.mergeContext(context), message);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.trace(this.mergeContext(context), message);
  }

  fatal(message: string, context?: LogContext) {
    this.logger.fatal(this.mergeContext(context), message);
  }

  // Structured logging methods
  logRequest(req: Request) {
    const reqWithUser = req as RequestWithUser;
    this.logger.info({
      type: 'request',
      requestId: reqWithUser.requestId || req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers as Record<string, unknown>),
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: reqWithUser.user?.id,
    }, `${req.method} ${req.url}`);
  }

  logResponse(req: Request, res: Response, responseTime: number) {
    const reqWithUser = req as RequestWithUser;
    this.logger.info({
      type: 'response',
      requestId: reqWithUser.requestId || req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: reqWithUser.user?.id,
    }, `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`);
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    this.logger.debug({
      type: 'database',
      query,
      duration: `${duration}ms`,
      ...context,
    }, `Database query executed in ${duration}ms`);
  }

  logExternalApi(service: string, method: string, url: string, duration: number, statusCode?: number) {
    this.logger.info({
      type: 'external_api',
      service,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    }, `External API call to ${service}: ${method} ${url} - ${statusCode} in ${duration}ms`);
  }

  logBusinessEvent(event: string, data?: LogContext) {
    this.logger.info({
      type: 'business_event',
      event,
      ...data,
    }, `Business event: ${event}`);
  }

  logSecurityEvent(event: string, data?: LogContext) {
    this.logger.warn({
      type: 'security',
      event,
      ...data,
    }, `Security event: ${event}`);
  }

  logPerformance(operation: string, duration: number, context?: LogContext) {
    this.logger.info({
      type: 'performance',
      operation,
      duration: `${duration}ms`,
      ...context,
    }, `Performance: ${operation} took ${duration}ms`);
  }

  private mergeContext(context?: LogContext): LogContext {
    return {
      ...context,
      context: this.context,
    };
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}

