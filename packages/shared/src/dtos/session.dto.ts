import { SessionNoteStatus } from '../enums';
import { AppointmentDto } from './appointment.dto';
import { ClientProfileDto } from './client.dto';

export interface SessionDto {
  id: string;
  appointmentId: string;
  therapistId: string;
  clientId: string;
  userId: string;
  
  // Session details
  sessionNumber?: number;
  actualStart?: Date;
  actualEnd?: Date;
  duration?: number;
  
  // Notes (encrypted)
  clinicalNotes?: string;
  privateNotes?: string; // Gizli notlar (sadece THERAPIST görebilir)
  isPrivate?: boolean; // Notların gizli olup olmadığı flag'i
  treatmentPlan?: string;
  progressNotes?: string;
  diagnosis?: string;
  interventions?: string[];
  homework?: string;
  riskAssessment?: string;
  
  // AI/Recording
  recordingUrl?: string;
  transcriptionUrl?: string;
  aiSummary?: string;
  
  // Status
  noteStatus: SessionNoteStatus;
  signedAt?: Date;
  signedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  appointment?: AppointmentDto;
  client?: ClientProfileDto;
}

export interface CreateSessionDto {
  appointmentId: string;
  therapistId: string;
  clientId: string;
  sessionNumber?: number;
  actualStart?: string;
  actualEnd?: string;
}

export interface UpdateSessionNotesDto {
  clinicalNotes?: string;
  privateNotes?: string; // Gizli notlar (sadece THERAPIST görebilir)
  isPrivate?: boolean; // Notların gizli olup olmadığı flag'i
  treatmentPlan?: string;
  progressNotes?: string;
  diagnosis?: string;
  interventions?: string[];
  homework?: string;
  riskAssessment?: string;
  noteStatus?: SessionNoteStatus;
}

export interface SignSessionDto {
  signature: string;
}

export interface SessionQueryDto {
  page?: number;
  limit?: number;
  therapistId?: string;
  clientId?: string;
  noteStatus?: SessionNoteStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'actualStart';
  sortOrder?: 'asc' | 'desc';
}

export interface SessionWithRelationsDto extends SessionDto {
  appointment: AppointmentDto;
  client: ClientProfileDto;
}

export interface StartSessionFromAppointmentDto {
  appointmentId: string;
  actualStart?: string; // ISO datetime string
}

export interface CompleteSessionDto {
  actualEnd?: string; // ISO datetime string
  duration?: number; // minutes
  createPayment?: boolean; // Opsiyonel: Ödeme kaydı oluştur
}
