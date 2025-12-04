import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Session, SessionNoteStatus } from '@prisma/client';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SESSION_REPOSITORY } from '../../infrastructure/database/database.providers';
import { LoggerService } from '../../infrastructure/logger';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(SessionsService.name);
  }

  async findAll(page = 1, limit = 20, filters?: {
    therapistId?: string;
    clientId?: string;
    noteStatus?: SessionNoteStatus;
  }): Promise<{
    success: boolean;
    data: Session[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let result;
    
    if (filters?.therapistId) {
      result = await this.sessionRepository.findByTherapistId(filters.therapistId, page, limit);
    } else if (filters?.clientId) {
      result = await this.sessionRepository.findByClientId(filters.clientId, page, limit);
    } else {
      result = await this.sessionRepository.findAll(page, limit);
    }

    this.logger.info(`Retrieved ${result.data.length} sessions`, {
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
    data: Session;
  }> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      this.logger.warn(`Session not found: ${id}`);
      throw new NotFoundException('Seans bulunamadı');
    }

    return {
      success: true,
      data: session,
    };
  }

  async findByAppointmentId(appointmentId: string): Promise<{
    success: boolean;
    data: Session;
  }> {
    const session = await this.sessionRepository.findByAppointmentId(appointmentId);

    if (!session) {
      throw new NotFoundException('Bu randevuya ait seans bulunamadı');
    }

    return {
      success: true,
      data: session,
    };
  }

  async create(dto: {
    appointmentId: string;
    therapistId: string;
    clientId: string;
    userId: string;
    sessionNumber?: number;
    actualStart?: Date;
    actualEnd?: Date;
  }): Promise<{
    success: boolean;
    data: Session;
    message: string;
  }> {
    // Check if session already exists for this appointment
    const existing = await this.sessionRepository.findByAppointmentId(dto.appointmentId);
    if (existing) {
      throw new BadRequestException('Bu randevu için zaten bir seans oluşturulmuş');
    }

    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    const session = await this.sessionRepository.create({
      appointment: { connect: { id: dto.appointmentId } },
      therapist: { connect: { id: dto.therapistId } },
      client: { connect: { id: dto.clientId } },
      user: { connect: { id: dto.userId } },
      sessionNumber: dto.sessionNumber,
      actualStart: dto.actualStart,
      actualEnd: dto.actualEnd,
      duration: dto.actualStart && dto.actualEnd 
        ? Math.round((dto.actualEnd.getTime() - dto.actualStart.getTime()) / 60000)
        : undefined,
    });

    this.logger.info(`Session created: ${session.id}`);

    return {
      success: true,
      data: session,
      message: 'Seans başarıyla oluşturuldu',
    };
  }

  async updateNotes(id: string, dto: {
    clinicalNotes?: string;
    treatmentPlan?: string;
    progressNotes?: string;
    diagnosis?: string;
    interventions?: string[];
    homework?: string;
    riskAssessment?: string;
    noteStatus?: SessionNoteStatus;
  }): Promise<{
    success: boolean;
    data: Session;
    message: string;
  }> {
    const existing = await this.sessionRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Seans bulunamadı');
    }

    // Cannot update notes if already signed
    if (existing.signedAt) {
      throw new BadRequestException('İmzalanmış seans notları güncellenemez');
    }

    await this.sessionRepository.updateNotes(id, dto);
    const session = await this.sessionRepository.findById(id);

    this.logger.info(`Session notes updated: ${id}`);

    return {
      success: true,
      data: session!,
      message: 'Seans notları güncellendi',
    };
  }

  async signSession(id: string, signedBy: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.sessionRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Seans bulunamadı');
    }

    if (existing.signedAt) {
      throw new BadRequestException('Seans zaten imzalanmış');
    }

    await this.sessionRepository.signSession(id, signedBy);

    this.logger.info(`Session signed: ${id} by ${signedBy}`);

    return {
      success: true,
      message: 'Seans imzalandı',
    };
  }

  async getClientHistory(clientId: string, limit = 10): Promise<{
    success: boolean;
    data: Session[];
  }> {
    const sessions = await this.sessionRepository.getClientHistory(clientId, limit);

    return {
      success: true,
      data: sessions,
    };
  }

  async getTherapistStats(therapistId: string, startDate: Date, endDate: Date): Promise<{
    success: boolean;
    data: {
      totalSessions: number;
      completedSessions: number;
      draftSessions: number;
      averageDuration: number;
    };
  }> {
    const stats = await this.sessionRepository.getTherapistStats(therapistId, startDate, endDate);

    return {
      success: true,
      data: stats,
    };
  }

  async getDraftSessions(therapistId?: string): Promise<{
    success: boolean;
    data: Session[];
  }> {
    const sessions = await this.sessionRepository.findByNoteStatus(SessionNoteStatus.DRAFT, therapistId);

    return {
      success: true,
      data: sessions,
    };
  }

  async remove(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.sessionRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Seans bulunamadı');
    }

    await this.sessionRepository.softDelete(id);

    this.logger.warn(`Session soft deleted: ${id}`);

    return {
      success: true,
      message: 'Seans silindi',
    };
  }
}

