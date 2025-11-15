import { PaymentStatus, PaymentMethod } from '../enums';
import { SessionDto } from './session.dto';
import { UserDto } from './user.dto';

export interface PaymentDto {
  id: string;
  sessionId?: string;
  userId: string;
  
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  
  // Payment details
  paidAt?: Date;
  paidAmount?: number;
  remainingAmount?: number;
  
  // External integrations
  stripePaymentId?: string;
  iyzicoPaymentId?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  
  // Refund
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  session?: SessionDto;
  user?: UserDto;
}

export interface CreatePaymentDto {
  sessionId?: string;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  notes?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  paidAmount?: number;
  notes?: string;
}

export interface ProcessPaymentDto {
  method: PaymentMethod;
  paidAmount: number;
  transactionId?: string;
  receiptUrl?: string;
}

export interface RefundPaymentDto {
  refundAmount: number;
  refundReason: string;
}

export interface PaymentQueryDto {
  page?: number;
  limit?: number;
  userId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'paidAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentStatsDto {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  refundedAmount: number;
  transactionCount: number;
  averageTransactionValue: number;
  currency: string;
}
