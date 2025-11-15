import { z } from 'zod';
import { PaymentStatus, PaymentMethod } from '../enums';

export const createPaymentSchema = z.object({
  sessionId: z.string().cuid().optional(),
  amount: z.number().positive('Tutar pozitif olmalıdır'),
  currency: z.string().length(3).default('TRY'),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  notes: z.string().max(1000).optional(),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  paidAmount: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export const processPaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  paidAmount: z.number().positive('Ödenen tutar pozitif olmalıdır'),
  transactionId: z.string().max(200).optional(),
  receiptUrl: z.string().url().optional(),
});

export const refundPaymentSchema = z.object({
  refundAmount: z.number().positive('İade tutarı pozitif olmalıdır'),
  refundReason: z.string().min(10, 'İade nedeni en az 10 karakter olmalıdır').max(1000),
});

export const paymentQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  userId: z.string().cuid().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().transform(Number).pipe(z.number().positive()).optional(),
  maxAmount: z.string().transform(Number).pipe(z.number().positive()).optional(),
  sortBy: z.enum(['createdAt', 'paidAt', 'amount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

