import { z } from 'zod';
import { AppointmentStatus } from '../enums';
export declare const createAppointmentSchema: z.ZodObject<{
    therapistId: z.ZodString;
    clientId: z.ZodString;
    startTime: z.ZodEffects<z.ZodDate, Date, Date>;
    duration: z.ZodNumber;
    type: z.ZodOptional<z.ZodString>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
    location: z.ZodOptional<z.ZodString>;
    appointmentNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    therapistId: string;
    clientId: string;
    startTime: Date;
    duration: number;
    type?: string | undefined;
    isOnline?: boolean | undefined;
    location?: string | undefined;
    appointmentNotes?: string | undefined;
}, {
    therapistId: string;
    clientId: string;
    startTime: Date;
    duration: number;
    type?: string | undefined;
    isOnline?: boolean | undefined;
    location?: string | undefined;
    appointmentNotes?: string | undefined;
}>;
export declare const updateAppointmentSchema: z.ZodObject<{
    startTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof AppointmentStatus>>;
    type: z.ZodOptional<z.ZodString>;
    isOnline: z.ZodOptional<z.ZodBoolean>;
    meetingLink: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    appointmentNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    status?: AppointmentStatus | undefined;
    startTime?: Date | undefined;
    duration?: number | undefined;
    isOnline?: boolean | undefined;
    location?: string | undefined;
    appointmentNotes?: string | undefined;
    meetingLink?: string | undefined;
}, {
    type?: string | undefined;
    status?: AppointmentStatus | undefined;
    startTime?: Date | undefined;
    duration?: number | undefined;
    isOnline?: boolean | undefined;
    location?: string | undefined;
    appointmentNotes?: string | undefined;
    meetingLink?: string | undefined;
}>;
export declare const cancelAppointmentSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const rescheduleAppointmentSchema: z.ZodObject<{
    newStartTime: z.ZodEffects<z.ZodDate, Date, Date>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    newStartTime: Date;
    reason?: string | undefined;
}, {
    newStartTime: Date;
    reason?: string | undefined;
}>;
