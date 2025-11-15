import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from './base.exception';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse.body);
  }

  private buildErrorResponse(exception: unknown, request: Request) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
    };

    if (exception instanceof BaseException) {
      // Custom domain exceptions
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      body.error = exceptionResponse.error;
      body.timestamp = exceptionResponse.timestamp;
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        body.error = {
          code: (exceptionResponse as any).error || 'HTTP_EXCEPTION',
          message: (exceptionResponse as any).message || exception.message,
          details: (exceptionResponse as any).details,
        };
      } else {
        body.error = {
          code: 'HTTP_EXCEPTION',
          message: exceptionResponse as string,
        };
      }
    } else if (exception instanceof Error) {
      // Generic Error
      body.error = {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'Bir hata oluştu' 
          : exception.message,
      };

      // Stack trace only in development
      if (process.env.NODE_ENV !== 'production') {
        body.error.details = { stack: exception.stack };
      }
    }

    return { statusCode, body };
  }

  private logError(exception: unknown, request: Request, errorResponse: any) {
    const { statusCode, body } = errorResponse;
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';

    const logMessage = `${method} ${url} ${statusCode} - ${body.error.code}`;
    const logContext = {
      statusCode,
      error: body.error,
      method,
      url,
      ip,
      userAgent,
      requestId: body.requestId,
      user: (request as any).user?.id,
    };

    if (statusCode >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : '', logContext);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage, logContext);
    }
  }
}

