import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Payment, PaymentStatus, PaymentMethod } from '@prisma/client';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../infrastructure/database/database.providers';
import { LoggerService } from '../../infrastructure/logger';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(PaymentsService.name);
  }

  async findAll(page = 1, limit = 20, filters?: {
    userId?: string;
    status?: PaymentStatus;
  }): Promise<{
    success: boolean;
    data: Payment[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let result;
    
    if (filters?.userId) {
      result = await this.paymentRepository.findByUserId(filters.userId, page, limit);
    } else if (filters?.status) {
      result = await this.paymentRepository.findByStatus(filters.status, page, limit);
    } else {
      result = await this.paymentRepository.findAll(page, limit);
    }

    this.logger.info(`Retrieved ${result.data.length} payments`, {
      page,
      limit,
      total: result.total,
    });

    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findOne(id: string): Promise<{
    success: boolean;
    data: Payment;
  }> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      this.logger.warn(`Payment not found: ${id}`);
      throw new NotFoundException('Ödeme bulunamadı');
    }

    return {
      success: true,
      data: payment,
    };
  }

  async findBySessionId(sessionId: string): Promise<{
    success: boolean;
    data: Payment;
  }> {
    const payment = await this.paymentRepository.findBySessionId(sessionId);

    if (!payment) {
      throw new NotFoundException('Bu seansa ait ödeme bulunamadı');
    }

    return {
      success: true,
      data: payment,
    };
  }

  async create(dto: {
    userId: string;
    sessionId?: string;
    amount: number;
    currency?: string;
    method?: PaymentMethod;
    notes?: string;
  }): Promise<{
    success: boolean;
    data: Payment;
    message: string;
  }> {
    // If sessionId provided, verify it exists
    if (dto.sessionId) {
      const session = await this.prisma.session.findUnique({
        where: { id: dto.sessionId },
      });

      if (!session) {
        throw new NotFoundException('Seans bulunamadı');
      }

      // Check if payment already exists for this session
      const existingPayment = await this.paymentRepository.findBySessionId(dto.sessionId);
      if (existingPayment) {
        throw new BadRequestException('Bu seans için zaten bir ödeme kaydı var');
      }
    }

    const payment = await this.paymentRepository.create({
      user: { connect: { id: dto.userId } },
      session: dto.sessionId ? { connect: { id: dto.sessionId } } : undefined,
      amount: dto.amount,
      currency: dto.currency || 'TRY',
      method: dto.method || PaymentMethod.CASH,
      notes: dto.notes,
    });

    this.logger.info(`Payment created: ${payment.id}`);

    return {
      success: true,
      data: payment,
      message: 'Ödeme kaydı oluşturuldu',
    };
  }

  async update(id: string, dto: {
    amount?: number;
    status?: PaymentStatus;
    method?: PaymentMethod;
    notes?: string;
  }): Promise<{
    success: boolean;
    data: Payment;
    message: string;
  }> {
    const existing = await this.paymentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Ödeme bulunamadı');
    }

    const payment = await this.paymentRepository.update(id, dto);

    this.logger.info(`Payment updated: ${id}`);

    return {
      success: true,
      data: payment,
      message: 'Ödeme güncellendi',
    };
  }

  async processPayment(id: string, dto: {
    method: PaymentMethod;
    paidAmount: number;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.paymentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Ödeme bulunamadı');
    }

    // Allow processing if status is PENDING, PARTIALLY_PAID, or REFUNDED (for re-processing after refund)
    // Only block if payment is fully paid (PAID status and paidAmount >= amount)
    if (existing.status === PaymentStatus.PAID && Number(existing.paidAmount || 0) >= Number(existing.amount)) {
      throw new BadRequestException('Bu ödeme zaten tamamlanmış');
    }
    
    // Allow REFUNDED payments to be processed again if there's remaining amount
    // REFUNDED status is now handled by checking if amount > paidAmount

    await this.paymentRepository.processPayment(id, dto.paidAmount, dto.method);

    this.logger.info(`Payment processed: ${id}, amount: ${dto.paidAmount}`);

    return {
      success: true,
      message: 'Ödeme işlendi',
    };
  }

  async refund(id: string, dto: {
    refundAmount: number;
    refundReason: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.paymentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Ödeme bulunamadı');
    }

    if (existing.status !== PaymentStatus.PAID && existing.status !== PaymentStatus.PARTIALLY_PAID) {
      throw new BadRequestException('Sadece ödenmiş ödemeler iade edilebilir');
    }

    const paidAmount = Number(existing.paidAmount) || 0;
    if (dto.refundAmount > paidAmount) {
      throw new BadRequestException('İade tutarı ödenen tutardan fazla olamaz');
    }

    await this.paymentRepository.refundPayment(id, dto.refundAmount, dto.refundReason);

    this.logger.warn(`Payment refunded: ${id}, amount: ${dto.refundAmount}, reason: ${dto.refundReason}`);

    return {
      success: true,
      message: 'İade işlendi',
    };
  }

  async getPendingPayments(userId?: string): Promise<{
    success: boolean;
    data: Payment[];
  }> {
    const payments = await this.paymentRepository.findPendingPayments(userId);

    return {
      success: true,
      data: payments,
    };
  }

  async getStats(startDate: Date, endDate: Date, userId?: string): Promise<{
    success: boolean;
    data: {
      totalRevenue: number;
      paidAmount: number;
      pendingAmount: number;
      refundedAmount: number;
      transactionCount: number;
    };
  }> {
    const stats = await this.paymentRepository.getStats(startDate, endDate, userId);

    return {
      success: true,
      data: stats,
    };
  }

  async getRevenueByMethod(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    data: Record<PaymentMethod, number>;
  }> {
    const revenue = await this.paymentRepository.getRevenueByMethod(startDate, endDate);

    return {
      success: true,
      data: revenue,
    };
  }

  async remove(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.paymentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Ödeme bulunamadı');
    }

    await this.paymentRepository.softDelete(id);

    this.logger.warn(`Payment soft deleted: ${id}`);

    return {
      success: true,
      message: 'Ödeme silindi',
    };
  }
}

