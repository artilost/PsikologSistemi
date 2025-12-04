import { Injectable } from '@nestjs/common';
import { Session, SessionNoteStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SessionRepository } from '../../../domain/repositories/session.repository';

@Injectable()
export class SessionRepositoryImpl implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        appointment: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
        user: true,
        payment: true,
      },
    });
  }

  async findAll(page = 1, limit = 20): Promise<{
    data: Session[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        skip,
        take: limit,
        include: {
          appointment: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.session.count(),
    ]);

    return { data, total, page, limit };
  }

  async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({
      data,
      include: {
        appointment: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
        user: true,
      },
    });
  }

  async update(id: string, data: Prisma.SessionUpdateInput): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data,
      include: {
        appointment: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
        user: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.session.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { noteStatus: SessionNoteStatus.ARCHIVED });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { noteStatus: SessionNoteStatus.DRAFT });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.session.count({ where: { id } });
    return count > 0;
  }

  async findByAppointmentId(appointmentId: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { appointmentId },
      include: {
        appointment: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
        user: true,
      },
    });
  }

  async findByTherapistId(therapistId: string, page = 1, limit = 20): Promise<{
    data: Session[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.SessionWhereInput = { therapistId };

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        include: {
          appointment: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.session.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByClientId(clientId: string, page = 1, limit = 20): Promise<{
    data: Session[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.SessionWhereInput = { clientId };

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        include: {
          appointment: true,
          client: { include: { user: true } },
          therapist: { include: { user: true } },
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.session.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByNoteStatus(status: SessionNoteStatus, therapistId?: string): Promise<Session[]> {
    const where: Prisma.SessionWhereInput = { noteStatus: status };
    if (therapistId) where.therapistId = therapistId;

    return this.prisma.session.findMany({
      where,
      include: {
        appointment: true,
        client: { include: { user: true } },
        therapist: { include: { user: true } },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateNotes(id: string, notes: Partial<Session>): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: notes,
    });
  }

  async signSession(id: string, signedBy: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signedBy,
        noteStatus: SessionNoteStatus.COMPLETED,
      },
    });
  }

  async getClientHistory(clientId: string, limit = 10): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { clientId },
      include: {
        appointment: true,
        therapist: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTherapistStats(therapistId: string, startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    completedSessions: number;
    draftSessions: number;
    averageDuration: number;
  }> {
    const sessions = await this.prisma.session.findMany({
      where: {
        therapistId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.noteStatus === SessionNoteStatus.COMPLETED).length;
    const draftSessions = sessions.filter(s => s.noteStatus === SessionNoteStatus.DRAFT).length;
    
    const durations = sessions
      .filter(s => s.duration !== null)
      .map(s => s.duration as number);
    
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    return {
      totalSessions,
      completedSessions,
      draftSessions,
      averageDuration,
    };
  }
}

