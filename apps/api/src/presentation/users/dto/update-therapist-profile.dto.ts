import { createZodDto } from 'nestjs-zod';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

const updateTherapistProfileSchema = extendApi(
    z.object({
        licenseNumber: z.string().optional(),
        specialization: z.array(z.string()).optional(),
        biography: z.string().optional(),
        yearsExperience: z.number().int().min(0).optional(),
        hourlyRate: z.number().min(0).optional(),
        sessionDuration: z.number().int().min(15).optional(),
        breakDuration: z.number().int().min(0).optional(), // Mola süresi (dakika)
        allowOnlineBooking: z.boolean().optional(),
        autoConfirmAppointment: z.boolean().optional(),
        workingHours: z.any().optional(), // JSON
    }),
    {
        title: 'UpdateTherapistProfileDto',
    }
);

export class UpdateTherapistProfileDto extends createZodDto(updateTherapistProfileSchema) { }
