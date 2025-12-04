import { Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository';

@Injectable()
export class AppointmentRepositoryImpl implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        user: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
        location: true,
        room: true,
      },
    });
  }

  async findAll(page = 1, limit = 20): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        skip,
        take: limit,
        include: {
          user: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.appointment.count(),
    ]);

    return { data, total, page, limit };
  }

  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    return this.prisma.appointment.create({
      data,
      include: {
        user: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
      },
    });
  }

  async update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        user: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { status: AppointmentStatus.CANCELLED });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { status: AppointmentStatus.SCHEDULED });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({ where: { id } });
    return count > 0;
  }

  async findByTherapistId(
    therapistId: string,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 20,
    excludeScheduled = true, // By default, exclude SCHEDULED appointments for therapists
  ): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.AppointmentWhereInput = { therapistId };

    // Exclude SCHEDULED appointments for therapists (they haven't confirmed yet)
    if (excludeScheduled) {
      where.status = { not: AppointmentStatus.SCHEDULED };
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByClientId(
    clientId: string,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 20,
  ): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.AppointmentWhereInput = { clientId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByStatus(status: AppointmentStatus, page = 1, limit = 20): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.AppointmentWhereInput = { status };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async hasConflict(therapistId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<boolean> {
    const where: Prisma.AppointmentWhereInput = {
      therapistId,
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      OR: [
        { startTime: { gte: startTime, lt: endTime } },
        { endTime: { gt: startTime, lte: endTime } },
        { AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }] },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.appointment.count({ where });
    return count > 0;
  }

  async getAvailableSlots(therapistId: string, date: Date, duration: number): Promise<Date[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        therapistId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Get therapist working hours (default 09:00 - 18:00)
    const workStart = 9;
    const workEnd = 18;
    const slots: Date[] = [];

    let currentSlot = new Date(startOfDay);
    currentSlot.setHours(workStart, 0, 0, 0);

    const endWork = new Date(startOfDay);
    endWork.setHours(workEnd, 0, 0, 0);

    while (currentSlot < endWork) {
      const slotEnd = new Date(currentSlot.getTime() + duration * 60000);
      
      const hasConflict = appointments.some(apt => {
        return (currentSlot >= apt.startTime && currentSlot < apt.endTime) ||
               (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
               (currentSlot <= apt.startTime && slotEnd >= apt.endTime);
      });

      if (!hasConflict && slotEnd <= endWork) {
        slots.push(new Date(currentSlot));
      }

      currentSlot = new Date(currentSlot.getTime() + 30 * 60000); // 30 min intervals
    }

    return slots;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: { 
        status,
        confirmedAt: status === AppointmentStatus.CONFIRMED ? new Date() : undefined,
      },
    });
  }

  async cancel(id: string, reason: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  }

  async reschedule(id: string, startTime: Date, endTime: Date): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: {
        startTime,
        endTime,
        status: AppointmentStatus.RESCHEDULED,
      },
    });
  }

  async findUpcoming(therapistId: string, limit = 5): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        therapistId,
        startTime: { gte: new Date() },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
      include: {
        user: true,
        client: { include: { user: true } },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
  }

  async findTodaysAppointments(therapistId: string): Promise<Appointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.prisma.appointment.findMany({
      where: {
        therapistId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        user: true,
        client: { include: { user: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}

