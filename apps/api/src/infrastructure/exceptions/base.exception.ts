import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorDetails {
  field?: string;
  message?: string;
  code?: string;
  [key: string]: any;
}

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly errorCode: string = 'INTERNAL_SERVER_ERROR',
    public readonly details?: ErrorDetails | ErrorDetails[],
  ) {
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          details,
        },
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

