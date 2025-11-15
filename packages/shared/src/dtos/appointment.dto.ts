import { AppointmentStatus } from '../enums';
import { UserDto } from './user.dto';
import { ClientProfileDto } from './client.dto';

export interface AppointmentDto {
  id: string;
  therapistId: string;
  clientId: string;
  userId: string;
  
  // Schedule
  startTime: Date;
  endTime: Date;
  duration: number;
  timeZone: string;
  
  // Status & Type
  status: AppointmentStatus;
  type: string;
  isOnline: boolean;
  meetingLink?: string;
  location?: string;
  
  // Notifications
  reminderSentAt?: Date;
  confirmedAt?: Date;
  
  // Cancellation
  cancelledAt?: Date;
  cancellationReason?: string;
  
  // Notes
  appointmentNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  user?: UserDto;
  client?: ClientProfileDto;
}

export interface CreateAppointmentDto {
  therapistId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  duration: number;
  type?: 'individual' | 'couple' | 'family' | 'group' | 'online' | 'in_person';
  isOnline?: boolean;
  meetingLink?: string;
  location?: string;
  appointmentNotes?: string;
}

export interface UpdateAppointmentDto {
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: AppointmentStatus;
  type?: 'individual' | 'couple' | 'family' | 'group' | 'online' | 'in_person';
  isOnline?: boolean;
  meetingLink?: string;
  location?: string;
  appointmentNotes?: string;
}

export interface CancelAppointmentDto {
  cancellationReason: string;
}

export interface RescheduleAppointmentDto {
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface AppointmentQueryDto {
  page?: number;
  limit?: number;
  therapistId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  type?: string;
  sortBy?: 'startTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TimeSlotDto {
  start: string;
  end: string;
  available: boolean;
  appointmentId?: string;
}

export interface AvailabilityDto {
  date: string;
  therapistId: string;
  slots: TimeSlotDto[];
}
