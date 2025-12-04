import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerService } from '../../infrastructure/logger';
import { AppointmentStatus, PaymentStatus, SessionNoteStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(ReportsService.name);
  }

  async getDashboardStats(organizationId?: string, therapistProfileId?: string): Promise<{
    success: boolean;
    data: {
      totalClients: number;
      totalAppointments: number;
      totalSessions: number;
      pendingPayments: number;
      todayAppointments: number;
      upcomingAppointments: number;
    };
  }> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Build where clauses for filtering by therapist if provided
    const clientWhere: any = { isActive: true };
    const appointmentWhere: any = {};
    const sessionWhere: any = {};
    const paymentWhere: any = { status: PaymentStatus.PENDING };

    if (therapistProfileId) {
      clientWhere.therapistProfileId = therapistProfileId;
      appointmentWhere.therapistId = therapistProfileId;
      sessionWhere.therapistId = therapistProfileId;
      paymentWhere.session = { therapistId: therapistProfileId };
    }

    const [
      totalClients,
      totalAppointments,
      totalSessions,
      pendingPayments,
      todayAppointments,
      upcomingAppointments,
    ] = await Promise.all([
      this.prisma.clientProfile.count({ where: clientWhere }),
      this.prisma.appointment.count({ where: appointmentWhere }),
      this.prisma.session.count({ where: sessionWhere }),
      this.prisma.payment.count({ where: paymentWhere }),
      this.prisma.appointment.count({
        where: {
          ...appointmentWhere,
          startTime: { gte: startOfDay, lte: endOfDay },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...appointmentWhere,
          startTime: { gte: new Date(), lte: nextWeek },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalClients,
        totalAppointments,
        totalSessions,
        pendingPayments,
        todayAppointments,
        upcomingAppointments,
      },
    };
  }

  async getAppointmentStats(startDate: Date, endDate: Date, therapistId?: string): Promise<{
    success: boolean;
    data: {
      total: number;
      completed: number;
      cancelled: number;
      noShow: number;
      scheduled: number;
      completionRate: number;
      cancellationRate: number;
    };
  }> {
    const where: any = {
      startTime: { gte: startDate, lte: endDate },
    };
    if (therapistId) where.therapistId = therapistId;

    const appointments = await this.prisma.appointment.findMany({ where });

    const total = appointments.length;
    const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const cancelled = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
    const noShow = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    const scheduled = appointments.filter(a => 
      a.status === AppointmentStatus.SCHEDULED || a.status === AppointmentStatus.CONFIRMED
    ).length;

    return {
      success: true,
      data: {
        total,
        completed,
        cancelled,
        noShow,
        scheduled,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      },
    };
  }

  async getRevenueReport(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    data: {
      totalRevenue: number;
      paidAmount: number;
      pendingAmount: number;
      refundedAmount: number;
      transactionCount: number;
      averageTransactionValue: number;
      revenueByMethod: Record<string, number>;
      revenueByDay: { date: string; amount: number }[];
    };
  }> {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paidAmount = payments
      .filter(p => p.status === PaymentStatus.PAID || p.status === PaymentStatus.PARTIALLY_PAID)
      .reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
    const pendingAmount = payments
      .filter(p => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const refundedAmount = payments
      .filter(p => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + Number(p.refundAmount || 0), 0);

    const revenueByMethod: Record<string, number> = {};
    payments
      .filter(p => p.status === PaymentStatus.PAID || p.status === PaymentStatus.PARTIALLY_PAID)
      .forEach(p => {
        revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + Number(p.paidAmount || 0);
      });

    // Group by day
    const revenueByDay: { date: string; amount: number }[] = [];
    const dayMap = new Map<string, number>();
    payments
      .filter(p => p.paidAt)
      .forEach(p => {
        const dateStr = p.paidAt!.toISOString().split('T')[0];
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + Number(p.paidAmount || 0));
      });
    dayMap.forEach((amount, date) => revenueByDay.push({ date, amount }));
    revenueByDay.sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        totalRevenue,
        paidAmount,
        pendingAmount,
        refundedAmount,
        transactionCount: payments.length,
        averageTransactionValue: payments.length > 0 ? totalRevenue / payments.length : 0,
        revenueByMethod,
        revenueByDay,
      },
    };
  }

  async getTherapistPerformance(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    data: {
      therapistId: string;
      name: string;
      totalSessions: number;
      completedSessions: number;
      totalRevenue: number;
      averageSessionDuration: number;
    }[];
  }> {
    const therapists = await this.prisma.therapistProfile.findMany({
      include: { user: true },
    });

    const result = await Promise.all(
      therapists.map(async (therapist) => {
        const sessions = await this.prisma.session.findMany({
          where: {
            therapistId: therapist.id,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        const payments = await this.prisma.payment.findMany({
          where: {
            session: { therapistId: therapist.id },
            createdAt: { gte: startDate, lte: endDate },
            status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID] },
          },
        });

        const durations = sessions
          .filter(s => s.duration !== null)
          .map(s => s.duration as number);

        return {
          therapistId: therapist.id,
          name: `${therapist.user.firstName} ${therapist.user.lastName}`,
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.noteStatus === SessionNoteStatus.COMPLETED).length,
          totalRevenue: payments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0),
          averageSessionDuration: durations.length > 0 
            ? durations.reduce((a, b) => a + b, 0) / durations.length 
            : 0,
        };
      })
    );

    return {
      success: true,
      data: result,
    };
  }

  async getClientReport(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    data: {
      newClients: number;
      activeClients: number;
      inactiveClients: number;
      clientsByMonth: { month: string; count: number }[];
    };
  }> {
    const [newClients, activeClients, inactiveClients] = await Promise.all([
      this.prisma.clientProfile.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.clientProfile.count({ where: { isActive: true } }),
      this.prisma.clientProfile.count({ where: { isActive: false } }),
    ]);

    // Group by month
    const clients = await this.prisma.clientProfile.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    });

    const monthMap = new Map<string, number>();
    clients.forEach(c => {
      const monthStr = c.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthMap.set(monthStr, (monthMap.get(monthStr) || 0) + 1);
    });

    const clientsByMonth: { month: string; count: number }[] = [];
    monthMap.forEach((count, month) => clientsByMonth.push({ month, count }));
    clientsByMonth.sort((a, b) => a.month.localeCompare(b.month));

    return {
      success: true,
      data: {
        newClients,
        activeClients,
        inactiveClients,
        clientsByMonth,
      },
    };
  }
}

