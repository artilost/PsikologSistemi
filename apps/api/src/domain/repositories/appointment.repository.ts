import { Appointment, AppointmentStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface AppointmentRepository extends BaseRepository<Appointment> {
  /**
   * Find appointments by therapist
   * @param excludeScheduled If true, excludes SCHEDULED appointments (default: true for therapists)
   */
  findByTherapistId(
    therapistId: string,
    startDate?: Date,
    endDate?: Date,
    page?: number,
    limit?: number,
    excludeScheduled?: boolean,
  ): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find appointments by client
   */
  findByClientId(
    clientId: string,
    startDate?: Date,
    endDate?: Date,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find appointments by status
   */
  findByStatus(status: AppointmentStatus, page?: number, limit?: number): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Check for time slot conflicts
   */
  hasConflict(therapistId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<boolean>;

  /**
   * Get available time slots for a therapist on a specific date
   */
  getAvailableSlots(therapistId: string, date: Date, duration: number): Promise<Date[]>;

  /**
   * Update appointment status
   */
  updateStatus(id: string, status: AppointmentStatus): Promise<void>;

  /**
   * Cancel appointment
   */
  cancel(id: string, reason: string): Promise<void>;

  /**
   * Reschedule appointment
   */
  reschedule(id: string, startTime: Date, endTime: Date): Promise<void>;

  /**
   * Get upcoming appointments
   */
  findUpcoming(therapistId: string, limit?: number): Promise<Appointment[]>;

  /**
   * Get today's appointments
   */
  findTodaysAppointments(therapistId: string): Promise<Appointment[]>;
}

