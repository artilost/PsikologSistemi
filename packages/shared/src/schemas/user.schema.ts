import { z } from 'zod';
import { UserRole } from '../enums';

export const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz').toLowerCase().trim(),
  phone: z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz').toLowerCase().trim().optional(),
  phone: z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').optional(),
  avatar: z.string().url('Geçerli bir URL giriniz').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz').toLowerCase().trim(),
  password: z.string().min(1, 'Şifre zorunludur'),
});

