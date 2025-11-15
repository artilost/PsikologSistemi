import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ZodValidationException } from 'nestjs-zod';
import { Response } from 'express';
import { ValidationException } from './domain.exceptions';

@Catch(ZodValidationException)
export class ZodValidationFilter extends BaseExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const zodError = exception.getZodError();
    
    const details = zodError.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));

    const validationException = new ValidationException(details);
    
    response
      .status(validationException.getStatus())
      .json(validationException.getResponse());
  }
}

