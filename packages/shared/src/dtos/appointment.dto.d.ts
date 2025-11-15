import { AppointmentStatus } from '../enums';
export interface AppointmentDto {
    id: string;
    therapistId: string;
    clientId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: AppointmentStatus;
    type: string;
    isOnline: boolean;
    meetingLink?: string;
    location?: string;
    reminderSentAt?: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    appointmentNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateAppointmentDto {
    therapistId: string;
    clientId: string;
    startTime: Date;
    duration: number;
    type?: string;
    isOnline?: boolean;
    location?: string;
    appointmentNotes?: string;
}
export interface UpdateAppointmentDto {
    startTime?: Date;
    duration?: number;
    status?: AppointmentStatus;
    type?: string;
    isOnline?: boolean;
    meetingLink?: string;
    location?: string;
    appointmentNotes?: string;
}
export interface CancelAppointmentDto {
    reason?: string;
}
export interface RescheduleAppointmentDto {
    newStartTime: Date;
    reason?: string;
}
