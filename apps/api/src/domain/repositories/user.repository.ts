import { User, UserRole, UserStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface UserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
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
}

