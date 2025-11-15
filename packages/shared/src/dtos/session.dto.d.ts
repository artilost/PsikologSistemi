import { SessionNoteStatus } from '../enums';
export interface SessionDto {
    id: string;
    appointmentId: string;
    therapistId: string;
    clientId: string;
    sessionNumber?: number;
    actualStart?: Date;
    actualEnd?: Date;
    duration?: number;
    clinicalNotes?: string;
    treatmentPlan?: string;
    progressNotes?: string;
    diagnosis?: string;
    interventions?: string[];
    homework?: string;
    riskAssessment?: string;
    noteStatus: SessionNoteStatus;
    signedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateSessionDto {
    appointmentId: string;
    actualStart?: Date;
    actualEnd?: Date;
}
export interface UpdateSessionNotesDto {
    clinicalNotes?: string;
    treatmentPlan?: string;
    progressNotes?: string;
    diagnosis?: string;
    interventions?: string[];
    homework?: string;
    riskAssessment?: string;
    noteStatus?: SessionNoteStatus;
}
