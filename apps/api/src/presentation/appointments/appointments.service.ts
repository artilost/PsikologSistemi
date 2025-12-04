import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import { APPOINTMENT_REPOSITORY } from '../../infrastructure/database/database.providers';
import { LoggerService } from '../../infrastructure/logger';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AppointmentsService.name);
  }

  async findAll(page = 1, limit = 20, filters?: {
    therapistId?: string;
    clientId?: string;
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
    excludeScheduled?: boolean; // For therapists, exclude SCHEDULED appointments by default
  }): Promise<{
    success: boolean;
    data: Appointment[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let result;
    
    if (filters?.therapistId) {
      // For therapists, exclude SCHEDULED appointments by default (unless explicitly requested)
      const excludeScheduled = filters.excludeScheduled !== false;
      result = await this.appointmentRepository.findByTherapistId(
        filters.therapistId,
        filters.startDate,
        filters.endDate,
        page,
        limit,
        excludeScheduled,
      );
    } else if (filters?.clientId) {
      result = await this.appointmentRepository.findByClientId(
        filters.clientId,
        filters.startDate,
        filters.endDate,
        page,
        limit,
      );
    } else if (filters?.status) {
      result = await this.appointmentRepository.findByStatus(filters.status, page, limit);
    } else {
      result = await this.appointmentRepository.findAll(page, limit);
    }

    this.logger.info(`Retrieved ${result.data.length} appointments`, {
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
    data: Appointment;
  }> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      this.logger.warn(`Appointment not found: ${id}`);
      throw new NotFoundException('Randevu bulunamadı');
    }

    return {
      success: true,
      data: appointment,
    };
  }

  async create(dto: {
    therapistId: string;
    clientId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    type?: string;
    isOnline?: boolean;
    meetingLink?: string;
    locationId?: string;
    roomId?: string;
    appointmentNotes?: string;
  }): Promise<{
    success: boolean;
    data: Appointment;
    message: string;
  }> {
    // Check for conflicts
    const hasConflict = await this.appointmentRepository.hasConflict(
      dto.therapistId,
      dto.startTime,
      dto.endTime,
    );

    if (hasConflict) {
      throw new BadRequestException('Bu zaman diliminde başka bir randevu var');
    }

    // Verify therapist exists
    const therapist = await this.prisma.therapistProfile.findUnique({
      where: { id: dto.therapistId },
    });

    if (!therapist) {
      throw new NotFoundException('Terapist bulunamadı');
    }

    // Verify client exists
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Danışan bulunamadı');
    }

    const appointment = await this.appointmentRepository.create({
      therapist: { connect: { id: dto.therapistId } },
      client: { connect: { id: dto.clientId } },
      user: { connect: { id: dto.userId } },
      startTime: dto.startTime,
      endTime: dto.endTime,
      duration: dto.duration,
      type: dto.type || 'individual',
      isOnline: dto.isOnline || false,
      meetingLink: dto.meetingLink,
      appointmentNotes: dto.appointmentNotes,
      location: dto.locationId ? { connect: { id: dto.locationId } } : undefined,
      room: dto.roomId ? { connect: { id: dto.roomId } } : undefined,
    });

    this.logger.info(`Appointment created: ${appointment.id}`);

    return {
      success: true,
      data: appointment,
      message: 'Randevu başarıyla oluşturuldu',
    };
  }

  async update(id: string, dto: Partial<{
    startTime: Date;
    endTime: Date;
    duration: number;
    type: string;
    isOnline: boolean;
    meetingLink: string;
    appointmentNotes: string;
  }>): Promise<{
    success: boolean;
    data: Appointment;
    message: string;
  }> {
    const existing = await this.appointmentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    // Check for conflicts if time is being updated
    if (dto.startTime || dto.endTime) {
      const hasConflict = await this.appointmentRepository.hasConflict(
        existing.therapistId,
        dto.startTime || existing.startTime,
        dto.endTime || existing.endTime,
        id,
      );

      if (hasConflict) {
        throw new BadRequestException('Bu zaman diliminde başka bir randevu var');
      }
    }

    const appointment = await this.appointmentRepository.update(id, dto);

    this.logger.info(`Appointment updated: ${id}`);

    return {
      success: true,
      data: appointment,
      message: 'Randevu başarıyla güncellendi',
    };
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.appointmentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    await this.appointmentRepository.updateStatus(id, status);

    this.logger.info(`Appointment status updated: ${id} -> ${status}`);

    return {
      success: true,
      message: 'Randevu durumu güncellendi',
    };
  }

  async cancel(id: string, reason: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.appointmentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    await this.appointmentRepository.cancel(id, reason);

    this.logger.warn(`Appointment cancelled: ${id}, reason: ${reason}`);

    return {
      success: true,
      message: 'Randevu iptal edildi',
    };
  }

  async reschedule(id: string, startTime: Date, endTime: Date): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.appointmentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    // Check for conflicts
    const hasConflict = await this.appointmentRepository.hasConflict(
      existing.therapistId,
      startTime,
      endTime,
      id,
    );

    if (hasConflict) {
      throw new BadRequestException('Bu zaman diliminde başka bir randevu var');
    }

    await this.appointmentRepository.reschedule(id, startTime, endTime);

    this.logger.info(`Appointment rescheduled: ${id}`);

    return {
      success: true,
      message: 'Randevu yeniden planlandı',
    };
  }

  async getAvailableSlots(therapistId: string, date: Date, duration: number): Promise<{
    success: boolean;
    data: Date[];
  }> {
    const slots = await this.appointmentRepository.getAvailableSlots(therapistId, date, duration);

    return {
      success: true,
      data: slots,
    };
  }

  async getUpcoming(therapistId: string, limit = 5): Promise<{
    success: boolean;
    data: Appointment[];
  }> {
    const appointments = await this.appointmentRepository.findUpcoming(therapistId, limit);

    return {
      success: true,
      data: appointments,
    };
  }

  async getTodaysAppointments(therapistId: string): Promise<{
    success: boolean;
    data: Appointment[];
  }> {
    const appointments = await this.appointmentRepository.findTodaysAppointments(therapistId);

    return {
      success: true,
      data: appointments,
    };
  }

  async remove(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.appointmentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Randevu bulunamadı');
    }

    await this.appointmentRepository.softDelete(id);

    this.logger.warn(`Appointment soft deleted: ${id}`);

    return {
      success: true,
      message: 'Randevu silindi',
    };
  }
}

