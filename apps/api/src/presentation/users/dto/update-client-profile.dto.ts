import { createZodDto } from 'nestjs-zod';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

const updateClientProfileSchema = extendApi(
    z.object({
        dateOfBirth: z.string().optional(), // ISO Date string
        gender: z.string().optional(),
        occupation: z.string().optional(),
        emergContact: z.string().optional(),
        emergPhone: z.string().optional(),
        address: z.string().optional(),
        medicalHistory: z.string().optional(),
        currentMedication: z.string().optional(),
        allergies: z.string().optional(),
        referredBy: z.string().optional(),
    }),
    {
        title: 'UpdateClientProfileDto',
    }
);

export class UpdateClientProfileDto extends createZodDto(updateClientProfileSchema) { }
