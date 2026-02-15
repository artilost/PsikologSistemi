import { z } from 'zod';
import { SessionNoteStatus } from '../enums';

export const createSessionSchema = z.object({
  appointmentId: z.string().cuid(),
  therapistId: z.string().cuid(),
  clientId: z.string().cuid(),
  sessionNumber: z.number().int().positive().optional(),
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
});

export const updateSessionNotesSchema = z.object({
  clinicalNotes: z.string().max(10000).optional(),
  privateNotes: z.string().max(10000).optional(), // Gizli notlar (sadece THERAPIST görebilir)
  isPrivate: z.boolean().optional(), // Notların gizli olup olmadığı flag'i
  treatmentPlan: z.string().max(5000).optional(),
  progressNotes: z.string().max(5000).optional(),
  diagnosis: z.string().max(2000).optional(),
  interventions: z.array(z.string().max(500)).optional(),
  homework: z.string().max(2000).optional(),
  riskAssessment: z.string().max(3000).optional(),
  noteStatus: z.nativeEnum(SessionNoteStatus).optional(),
});

export const signSessionSchema = z.object({
  signature: z.string().min(1, 'İmza zorunludur'),
});

export const sessionQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  therapistId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  noteStatus: z.nativeEnum(SessionNoteStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'actualStart']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const startSessionFromAppointmentSchema = z.object({
  appointmentId: z.string().cuid(),
  actualStart: z.string().datetime().optional(),
});

export const completeSessionSchema = z.object({
  actualEnd: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  createPayment: z.boolean().optional(),
});
