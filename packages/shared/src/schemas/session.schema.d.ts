import { z } from 'zod';
import { SessionNoteStatus } from '../enums';
export declare const createSessionSchema: z.ZodObject<{
    appointmentId: z.ZodString;
    actualStart: z.ZodOptional<z.ZodDate>;
    actualEnd: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    appointmentId: string;
    actualStart?: Date | undefined;
    actualEnd?: Date | undefined;
}, {
    appointmentId: string;
    actualStart?: Date | undefined;
    actualEnd?: Date | undefined;
}>;
export declare const updateSessionNotesSchema: z.ZodObject<{
    clinicalNotes: z.ZodOptional<z.ZodString>;
    treatmentPlan: z.ZodOptional<z.ZodString>;
    progressNotes: z.ZodOptional<z.ZodString>;
    diagnosis: z.ZodOptional<z.ZodString>;
    interventions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    homework: z.ZodOptional<z.ZodString>;
    riskAssessment: z.ZodOptional<z.ZodString>;
    noteStatus: z.ZodOptional<z.ZodNativeEnum<typeof SessionNoteStatus>>;
}, "strip", z.ZodTypeAny, {
    clinicalNotes?: string | undefined;
    treatmentPlan?: string | undefined;
    progressNotes?: string | undefined;
    diagnosis?: string | undefined;
    interventions?: string[] | undefined;
    homework?: string | undefined;
    riskAssessment?: string | undefined;
    noteStatus?: SessionNoteStatus | undefined;
}, {
    clinicalNotes?: string | undefined;
    treatmentPlan?: string | undefined;
    progressNotes?: string | undefined;
    diagnosis?: string | undefined;
    interventions?: string[] | undefined;
    homework?: string | undefined;
    riskAssessment?: string | undefined;
    noteStatus?: SessionNoteStatus | undefined;
}>;
