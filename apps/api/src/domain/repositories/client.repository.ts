import { ClientProfile, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface ClientRepository extends BaseRepository<ClientProfile, Prisma.ClientProfileCreateInput, Prisma.ClientProfileUpdateInput> {
  /**
   * Find client by user ID
   */
  findByUserId(userId: string): Promise<ClientProfile | null>;

  /**
   * Find active clients
   */
  findActiveClients(page?: number, limit?: number): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Search clients by name or email
   */
  searchClients(query: string, page?: number, limit?: number): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Update consent status
   */
  updateConsent(id: string, consentType: 'consent' | 'recording' | 'dataProcess', value: boolean): Promise<void>;
}

