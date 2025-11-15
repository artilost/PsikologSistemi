import { Session, SessionNoteStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface SessionRepository extends BaseRepository<Session> {
  /**
   * Find session by appointment ID
   */
  findByAppointmentId(appointmentId: string): Promise<Session | null>;

  /**
   * Find sessions by therapist
   */
  findByTherapistId(therapistId: string, page?: number, limit?: number): Promise<{
    data: Session[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find sessions by client
   */
  findByClientId(clientId: string, page?: number, limit?: number): Promise<{
    data: Session[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find sessions by note status
   */
  findByNoteStatus(status: SessionNoteStatus, therapistId?: string): Promise<Session[]>;

  /**
   * Update session notes
   */
  updateNotes(id: string, notes: Partial<Session>): Promise<void>;

  /**
   * Sign session
   */
  signSession(id: string, signedBy: string): Promise<void>;

  /**
   * Get session history for a client
   */
  getClientHistory(clientId: string, limit?: number): Promise<Session[]>;

  /**
   * Get session statistics for therapist
   */
  getTherapistStats(therapistId: string, startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    completedSessions: number;
    draftSessions: number;
    averageDuration: number;
  }>;
}

