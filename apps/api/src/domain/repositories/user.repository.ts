import { User, UserRole, UserStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface UserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  /**
   * Find all users with pagination
   * Override base findAll to include includeDeleted parameter
   */
  findAll(page?: number, limit?: number, includeDeleted?: boolean): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by phone
   */
  findByPhone(phone: string): Promise<User | null>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Promise<User[]>;

  /**
   * Find users by status
   */
  findByStatus(status: UserStatus): Promise<User[]>;

  /**
   * Update last login timestamp
   */
  updateLastLogin(id: string): Promise<void>;

  /**
   * Update user password
   */
  updatePassword(id: string, hashedPassword: string): Promise<void>;

  /**
   * Enable/disable MFA
   */
  updateMfa(id: string, enabled: boolean, secret?: string): Promise<void>;

  /**
   * Find all deleted users with pagination
   */
  findAllDeleted(page?: number, limit?: number): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }>;
}

