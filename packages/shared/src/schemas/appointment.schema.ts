import { z } from 'zod';
import { AppointmentStatus } from '../enums';

export const createAppointmentSchema = z.object({
  therapistId: z.string().cuid(),
  clientId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().int().positive().max(480), // max 8 hours
  type: z.enum(['individual', 'couple', 'family', 'group', 'online', 'in_person']).default('individual'),
  isOnline: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  location: z.string().max(500).optional(),
  appointmentNotes: z.string().max(2000).optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır',
    path: ['endTime'],
  }
);

export const updateAppointmentSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  duration: z.number().int().positive().max(480).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  type: z.enum(['individual', 'couple', 'family', 'group', 'online', 'in_person']).optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().url().optional(),
  location: z.string().max(500).optional(),
  appointmentNotes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  {
    message: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır',
    path: ['endTime'],
  }
);

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(10, 'İptal nedeni en az 10 karakter olmalıdır').max(1000),
});

export const rescheduleAppointmentSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır',
    path: ['endTime'],
  }
);

export const appointmentQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  therapistId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['individual', 'couple', 'family', 'group', 'online', 'in_person']).optional(),
  sortBy: z.enum(['startTime', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const availabilityQuerySchema = z.object({
  therapistId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih formatı: YYYY-MM-DD'),
  duration: z.string().transform(Number).pipe(z.number().int().positive().default(50)),
});
