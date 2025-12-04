import { Injectable } from '@nestjs/common';
import { Payment, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';

@Injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            appointment: true,
            client: { include: { user: true } },
          },
        },
        user: true,
      },
    });
  }

  async findAll(page = 1, limit = 20): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        include: {
          session: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count(),
    ]);

    return { data, total, page, limit };
  }

  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({
      data,
      include: {
        session: true,
        user: true,
      },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data,
      include: {
        session: true,
        user: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { status: PaymentStatus.CANCELLED });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { status: PaymentStatus.PENDING });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.payment.count({ where: { id } });
    return count > 0;
  }

  async findBySessionId(sessionId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { sessionId },
      include: {
        session: true,
        user: true,
      },
    });
  }

  async findByUserId(userId: string, page = 1, limit = 20): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          session: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByStatus(status: PaymentStatus, page = 1, limit = 20): Promise<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = { status };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          session: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findPendingPayments(userId?: string): Promise<Payment[]> {
    const where: Prisma.PaymentWhereInput = { status: PaymentStatus.PENDING };
    if (userId) where.userId = userId;

    return this.prisma.payment.findMany({
      where,
      include: {
        session: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processPayment(id: string, paidAmount: number, method: PaymentMethod): Promise<void> {
    const payment = await this.findById(id);
    if (!payment) return;

    // For REFUNDED payments, paidAmount might be reduced, so we need to add to current paidAmount
    // For other payments, we also add to current paidAmount
    const currentPaid = Number(payment.paidAmount) || 0;
    const totalPaid = currentPaid + paidAmount;
    const remaining = Number(payment.amount) - totalPaid;
    
    let status: PaymentStatus;
    if (remaining <= 0) {
      status = PaymentStatus.PAID;
    } else if (totalPaid > 0) {
      status = PaymentStatus.PARTIALLY_PAID;
    } else {
      status = PaymentStatus.PENDING;
    }

    await this.prisma.payment.update({
      where: { id },
      data: {
        paidAmount: totalPaid,
        remainingAmount: remaining > 0 ? remaining : 0,
        method,
        status,
        paidAt: status === PaymentStatus.PAID ? new Date() : payment.paidAt || undefined,
      },
    });
  }

  async refundPayment(id: string, refundAmount: number, reason: string): Promise<void> {
    const payment = await this.findById(id);
    if (!payment) return;

    const currentPaidAmount = Number(payment.paidAmount) || 0;
    const newPaidAmount = currentPaidAmount - refundAmount;
    const remainingAmount = Number(payment.amount) - newPaidAmount;

    // Status logic:
    // - If all paid amount is refunded (newPaidAmount <= 0), status is PENDING (can be paid again)
    // - If there's still paid amount and remaining amount, status is PARTIALLY_PAID
    // - If there's paid amount but no remaining, status is PAID
    // - REFUNDED status is only for fully refunded payments that won't be processed again
    //   But we want to allow re-processing, so we use PENDING or PARTIALLY_PAID
    let status: PaymentStatus;
    if (newPaidAmount <= 0) {
      status = PaymentStatus.PENDING; // Can be paid again
    } else if (remainingAmount > 0) {
      status = PaymentStatus.PARTIALLY_PAID; // Still has remaining amount
    } else {
      status = PaymentStatus.PAID; // Fully paid
    }

    await this.prisma.payment.update({
      where: { id },
      data: {
        status,
        refundedAt: new Date(),
        refundAmount: (Number(payment.refundAmount) || 0) + refundAmount, // Accumulate refunds
        refundReason: reason,
        paidAmount: newPaidAmount > 0 ? newPaidAmount : 0,
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
        paidAt: status === PaymentStatus.PAID ? payment.paidAt : null, // Keep paidAt if still paid
      },
    });
  }

  async getStats(startDate: Date, endDate: Date, userId?: string): Promise<{
    totalRevenue: number;
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
    transactionCount: number;
  }> {
    const where: Prisma.PaymentWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };
    if (userId) where.userId = userId;

    const payments = await this.prisma.payment.findMany({ where });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    // paidAmount: Sum of paidAmount for PAID and PARTIALLY_PAID payments, minus refunds
    const paidAmount = payments
      .filter(p => p.status === PaymentStatus.PAID || p.status === PaymentStatus.PARTIALLY_PAID)
      .reduce((sum, p) => {
        const paid = Number(p.paidAmount || 0);
        const refunded = Number(p.refundAmount || 0);
        return sum + (paid - refunded);
      }, 0);
    // pendingAmount: Sum of amount for PENDING payments, plus remainingAmount for PARTIALLY_PAID
    const pendingAmount = payments.reduce((sum, p) => {
      if (p.status === PaymentStatus.PENDING) {
        return sum + Number(p.amount);
      } else if (p.status === PaymentStatus.PARTIALLY_PAID) {
        return sum + Number(p.remainingAmount || 0);
      }
      return sum;
    }, 0);
    const refundedAmount = payments
      .filter(p => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + Number(p.refundAmount || 0), 0);

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      refundedAmount,
      transactionCount: payments.length,
    };
  }

  async getRevenueByMethod(startDate: Date, endDate: Date): Promise<Record<PaymentMethod, number>> {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID] },
      },
    });

    const result: Record<PaymentMethod, number> = {
      CASH: 0,
      CREDIT_CARD: 0,
      BANK_TRANSFER: 0,
      ONLINE: 0,
      INSURANCE: 0,
    };

    payments.forEach(p => {
      result[p.method] += Number(p.paidAmount || 0);
    });

    return result;
  }
}

