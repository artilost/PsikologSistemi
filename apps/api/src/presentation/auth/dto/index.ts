import { createZodDto } from 'nestjs-zod';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import {
  createUserSchema,
  loginSchema,
} from '@psikolog/shared';

const loginDtoSchema = extendApi(loginSchema, {
  title: 'LoginDto',
  example: {
    email: 'user@example.com',
    password: 'SecurePass123!',
  },
});

export class LoginDto extends createZodDto(loginDtoSchema) {}

const createUserDtoSchema = extendApi(createUserSchema, {
  title: 'CreateUserDto',
  example: {
    email: 'therapist@example.com',
    password: 'SecurePass123!',
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    phone: '+905551234567',
    role: 'THERAPIST',
  },
});

export class CreateUserDto extends createZodDto(createUserDtoSchema) {}

const refreshTokenSchema = extendApi(
  z.object({
    refreshToken: z.string().min(1, 'Refresh token zorunludur'),
  }),
  {
    title: 'RefreshTokenDto',
    example: {
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  }
);

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}

const forgotPasswordSchema = extendApi(
  z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  }),
  {
    title: 'ForgotPasswordDto',
    example: {
      email: 'user@example.com',
    },
  }
);

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}

const resetPasswordSchema = extendApi(
  z.object({
    token: z.string().min(1, 'Token zorunludur'),
    newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  }),
  {
    title: 'ResetPasswordDto',
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      newPassword: 'NewSecurePass123!',
    },
  }
);

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}

