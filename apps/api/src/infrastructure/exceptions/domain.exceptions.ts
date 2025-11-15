import { HttpStatus } from '@nestjs/common';
import { BaseException, ErrorDetails } from './base.exception';

// ============================================
// AUTHENTICATION & AUTHORIZATION
// ============================================

export class UnauthorizedException extends BaseException {
  constructor(message = 'Yetkisiz erişim', details?: ErrorDetails) {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenException extends BaseException {
  constructor(message = 'Bu işlem için yetkiniz bulunmamaktadır', details?: ErrorDetails) {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN', details);
  }
}

export class InvalidCredentialsException extends BaseException {
  constructor(message = 'E-posta veya şifre hatalı') {
    super(message, HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS');
  }
}

export class TokenExpiredException extends BaseException {
  constructor(message = 'Oturum süresi dolmuştur') {
    super(message, HttpStatus.UNAUTHORIZED, 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenException extends BaseException {
  constructor(message = 'Geçersiz token') {
    super(message, HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
  }
}

// ============================================
// RESOURCE NOT FOUND
// ============================================

export class NotFoundException extends BaseException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} bulunamadı (ID: ${identifier})`
      : `${resource} bulunamadı`;
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND', { resource, identifier });
  }
}

export class UserNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `Kullanıcı bulunamadı (${identifier})`,
      HttpStatus.NOT_FOUND,
      'USER_NOT_FOUND',
      { identifier },
    );
  }
}

export class ClientNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `Danışan bulunamadı (${identifier})`,
      HttpStatus.NOT_FOUND,
      'CLIENT_NOT_FOUND',
      { identifier },
    );
  }
}

export class AppointmentNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `Randevu bulunamadı (${identifier})`,
      HttpStatus.NOT_FOUND,
      'APPOINTMENT_NOT_FOUND',
      { identifier },
    );
  }
}

export class SessionNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `Seans bulunamadı (${identifier})`,
      HttpStatus.NOT_FOUND,
      'SESSION_NOT_FOUND',
      { identifier },
    );
  }
}

export class PaymentNotFoundException extends BaseException {
  constructor(identifier: string) {
    super(
      `Ödeme bulunamadı (${identifier})`,
      HttpStatus.NOT_FOUND,
      'PAYMENT_NOT_FOUND',
      { identifier },
    );
  }
}

// ============================================
// BUSINESS LOGIC ERRORS
// ============================================

export class ConflictException extends BaseException {
  constructor(message: string, details?: ErrorDetails) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT', details);
  }
}

export class DuplicateEmailException extends BaseException {
  constructor(email: string) {
    super(
      'Bu e-posta adresi zaten kullanılmaktadır',
      HttpStatus.CONFLICT,
      'DUPLICATE_EMAIL',
      { email },
    );
  }
}

export class DuplicatePhoneException extends BaseException {
  constructor(phone: string) {
    super(
      'Bu telefon numarası zaten kullanılmaktadır',
      HttpStatus.CONFLICT,
      'DUPLICATE_PHONE',
      { phone },
    );
  }
}

export class AppointmentConflictException extends BaseException {
  constructor(message = 'Bu zaman diliminde zaten bir randevu bulunmaktadır') {
    super(message, HttpStatus.CONFLICT, 'APPOINTMENT_CONFLICT');
  }
}

export class InvalidOperationException extends BaseException {
  constructor(message: string, details?: ErrorDetails) {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_OPERATION', details);
  }
}

export class AppointmentAlreadyCancelledException extends BaseException {
  constructor() {
    super(
      'Bu randevu zaten iptal edilmiştir',
      HttpStatus.BAD_REQUEST,
      'APPOINTMENT_ALREADY_CANCELLED',
    );
  }
}

export class AppointmentCannotBeCancelledException extends BaseException {
  constructor(reason: string) {
    super(
      `Randevu iptal edilemiyor: ${reason}`,
      HttpStatus.BAD_REQUEST,
      'APPOINTMENT_CANNOT_BE_CANCELLED',
      { reason },
    );
  }
}

export class SessionAlreadyExistsException extends BaseException {
  constructor() {
    super(
      'Bu randevu için zaten bir seans kaydı bulunmaktadır',
      HttpStatus.CONFLICT,
      'SESSION_ALREADY_EXISTS',
    );
  }
}

export class SessionNotCompletedException extends BaseException {
  constructor() {
    super(
      'Seans tamamlanmadan imzalanamaz',
      HttpStatus.BAD_REQUEST,
      'SESSION_NOT_COMPLETED',
    );
  }
}

export class PaymentAlreadyProcessedException extends BaseException {
  constructor() {
    super(
      'Bu ödeme zaten işlenmiştir',
      HttpStatus.BAD_REQUEST,
      'PAYMENT_ALREADY_PROCESSED',
    );
  }
}

// ============================================
// VALIDATION ERRORS
// ============================================

export class ValidationException extends BaseException {
  constructor(details: ErrorDetails | ErrorDetails[]) {
    super(
      'Doğrulama hatası',
      HttpStatus.BAD_REQUEST,
      'VALIDATION_ERROR',
      details,
    );
  }
}

export class InvalidDateRangeException extends BaseException {
  constructor(message = 'Geçersiz tarih aralığı') {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_DATE_RANGE');
  }
}

export class InvalidTimeSlotException extends BaseException {
  constructor(message = 'Geçersiz zaman dilimi') {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_TIME_SLOT');
  }
}

export class PastDateException extends BaseException {
  constructor(message = 'Geçmiş tarih seçilemez') {
    super(message, HttpStatus.BAD_REQUEST, 'PAST_DATE');
  }
}

// ============================================
// PERMISSION & ACCESS CONTROL
// ============================================

export class InsufficientPermissionsException extends BaseException {
  constructor(action: string) {
    super(
      `Bu işlemi gerçekleştirmek için yeterli izniniz yok: ${action}`,
      HttpStatus.FORBIDDEN,
      'INSUFFICIENT_PERMISSIONS',
      { action },
    );
  }
}

export class ResourceAccessDeniedException extends BaseException {
  constructor(resource: string) {
    super(
      `Bu kaynağa erişim izniniz bulunmamaktadır: ${resource}`,
      HttpStatus.FORBIDDEN,
      'RESOURCE_ACCESS_DENIED',
      { resource },
    );
  }
}

// ============================================
// RATE LIMITING & THROTTLING
// ============================================

export class TooManyRequestsException extends BaseException {
  constructor(message = 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS');
  }
}

// ============================================
// EXTERNAL SERVICE ERRORS
// ============================================

export class ExternalServiceException extends BaseException {
  constructor(service: string, message?: string) {
    super(
      message || `Dış servis hatası: ${service}`,
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      { service },
    );
  }
}

export class PaymentProviderException extends BaseException {
  constructor(provider: string, message: string) {
    super(
      `Ödeme işlemi başarısız: ${message}`,
      HttpStatus.BAD_REQUEST,
      'PAYMENT_PROVIDER_ERROR',
      { provider },
    );
  }
}

export class EmailSendException extends BaseException {
  constructor(email: string) {
    super(
      'E-posta gönderilemedi',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'EMAIL_SEND_ERROR',
      { email },
    );
  }
}

export class SmsSendException extends BaseException {
  constructor(phone: string) {
    super(
      'SMS gönderilemedi',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'SMS_SEND_ERROR',
      { phone },
    );
  }
}

