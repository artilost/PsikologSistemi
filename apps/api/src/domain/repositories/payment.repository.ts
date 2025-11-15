import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface PaymentRepository extends BaseRepository<Payment> {
  /**
   * Find payment by session ID
   */
  findBySessionId(sessionId: string): Promise<Payment | null>;

  /**
   * Find payments by user
   */
  findByUserId(userId: string, page?: number, limit?: number): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find payments by status
   */
  findByStatus(status: PaymentStatus, page?: number, limit?: number): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find pending payments
   */
  findPendingPayments(userId?: string): Promise<Payment[]>;

  /**
   * Process payment
   */
  processPayment(id: string, paidAmount: number, method: PaymentMethod): Promise<void>;

  /**
   * Refund payment
   */
  refundPayment(id: string, refundAmount: number, reason: string): Promise<void>;

  /**
   * Get payment statistics
   */
  getStats(startDate: Date, endDate: Date, userId?: string): Promise<{
    totalRevenue: number;
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
    transactionCount: number;
  }>;

  /**
   * Get revenue by method
   */
  getRevenueByMethod(startDate: Date, endDate: Date): Promise<Record<PaymentMethod, number>>;
}

