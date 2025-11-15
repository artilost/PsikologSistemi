import { z } from 'zod';

export const createClientProfileSchema = z.object({
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  occupation: z.string().max(100).optional(),
  emergContact: z.string().max(200).optional(),
  emergPhone: z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
  address: z.string().max(500).optional(),
  
  // Medical info
  medicalHistory: z.string().max(5000).optional(),
  currentMedication: z.string().max(2000).optional(),
  allergies: z.string().max(1000).optional(),
  referredBy: z.string().max(200).optional(),
  
  // Consent
  consentSigned: z.boolean().default(false),
  recordingConsent: z.boolean().default(false),
  dataProcessConsent: z.boolean().default(false),
  
  // Notes
  notes: z.string().max(5000).optional(),
});

export const updateClientProfileSchema = z.object({
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  occupation: z.string().max(100).optional(),
  emergContact: z.string().max(200).optional(),
  emergPhone: z.string().regex(/^(\+90|0)?5\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional(),
  address: z.string().max(500).optional(),
  medicalHistory: z.string().max(5000).optional(),
  currentMedication: z.string().max(2000).optional(),
  allergies: z.string().max(1000).optional(),
  referredBy: z.string().max(200).optional(),
  consentSigned: z.boolean().optional(),
  recordingConsent: z.boolean().optional(),
  dataProcessConsent: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
});

export const clientQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  search: z.string().max(100).optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
