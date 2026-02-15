import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, UserRole, UserStatus } from '@prisma/client';
import { UserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../infrastructure/database/database.providers';
import { UpdateUserDto, UserDto } from '@psikolog/shared';
import { DuplicateEmailException, DuplicatePhoneException } from '../../infrastructure/exceptions';
import { LoggerService } from '../../infrastructure/logger';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async findAll(page = 1, limit = 20, includeDeleted = false): Promise<{
    success: boolean;
    data: UserDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = includeDeleted 
      ? await this.userRepository.findAll(page, limit, true)
      : await this.userRepository.findAll(page, limit, false);

    this.logger.info(`Retrieved ${result.data.length} users`, {
      page,
      limit,
      total: result.total,
      includeDeleted,
    });

    return {
      success: true,
      data: result.data.map(this.sanitizeUser),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findAllDeleted(page = 1, limit = 20): Promise<{
    success: boolean;
    data: UserDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.userRepository.findAllDeleted(page, limit);

    this.logger.info(`Retrieved ${result.data.length} deleted users`, {
      page,
      limit,
      total: result.total,
    });

    return {
      success: true,
      data: result.data.map(this.sanitizeUser),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findOne(id: string, currentUser?: { id: string; role: string; organizationId?: string }): Promise<{
    success: boolean;
    data: UserDto;
  }> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Tenant Isolation Check
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      // If user belongs to an organization, they can only see users from the same organization
      if (currentUser.organizationId && user.organizationId !== currentUser.organizationId) {
        this.logger.warn(`Tenant isolation violation: User ${currentUser['id']} tried to access User ${id}`);
        throw new ForbiddenException('Bu kullanıcıya erişim yetkiniz yok');
      }
    }

    this.logger.info(`Retrieved user: ${user.email}`);

    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  async update(id: string, dto: UpdateUserDto, currentUser?: { id: string; role: string; organizationId?: string }): Promise<{
    success: boolean;
    data: UserDto;
    message: string;
  }> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Authorization check: users can only update themselves unless they're ADMIN/SUPER_ADMIN
    if (currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      if (currentUser.id !== id) {
        throw new ForbiddenException('Bu kullanıcıyı güncelleme yetkiniz yok');
      }
    }

    // Tenant Isolation Check for ADMIN
    if (currentUser && currentUser.role === 'ADMIN' && currentUser.organizationId) {
      if (existingUser.organizationId !== currentUser.organizationId) {
        throw new ForbiddenException('Bu kullanıcıyı güncelleme yetkiniz yok');
      }
    }

    // Check email uniqueness if changed
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(dto.email);
      if (emailExists) {
        throw new DuplicateEmailException(dto.email);
      }
    }

    // Check phone uniqueness if changed
    if (dto.phone && dto.phone !== existingUser.phone) {
      const phoneExists = await this.userRepository.findByPhone(dto.phone);
      if (phoneExists) {
        throw new DuplicatePhoneException(dto.phone);
      }
    }

    const updatedUser = await this.userRepository.update(id, dto);

    this.logger.info(`User updated: ${updatedUser.email}`, { userId: id });

    return {
      success: true,
      data: this.sanitizeUser(updatedUser),
      message: 'Kullanıcı başarıyla güncellendi',
    };
  }

  async remove(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    await this.userRepository.softDelete(id);

    this.logger.warn(`User soft deleted: ${user.email}`, { userId: id });

    return {
      success: true,
      message: 'Kullanıcı başarıyla silindi',
    };
  }

  async restore(id: string): Promise<{
    success: boolean;
    data: UserDto;
    message: string;
  }> {
    await this.userRepository.restore(id);

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    this.logger.info(`User restored: ${user.email}`, { userId: id });

    return {
      success: true,
      data: this.sanitizeUser(user),
      message: 'Kullanıcı başarıyla geri yüklendi',
    };
  }

  /**
   * Get list of therapists (accessible by all authenticated users)
   * Only returns users with THERAPIST role (not ADMIN or SUPER_ADMIN)
   */
  async getTherapists(): Promise<{
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
  }> {
    try {
      const therapists = await this.prisma.user.findMany({
        where: {
          role: UserRole.THERAPIST, // Only THERAPIST role, not ADMIN or SUPER_ADMIN
          // Include all statuses except SUSPENDED
          status: {
            not: UserStatus.SUSPENDED,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          therapistProfile: {
            select: {
              id: true,
              sessionDuration: true,
              breakDuration: true,
              hourlyRate: true,
              specialization: true,
              workingHours: true,
            },
          },
        },
      });

      this.logger.info(`Retrieved ${therapists.length} therapists`);

      // Create TherapistProfile for therapists who don't have one
      const therapistsWithProfiles = await Promise.all(
        therapists.map(async (user) => {
          let therapistProfile = user.therapistProfile;
          
          // If therapist doesn't have a profile, create one
          if (!therapistProfile) {
            this.logger.info(`Creating missing TherapistProfile for user: ${user.id}`);
            therapistProfile = await this.prisma.therapistProfile.create({
              data: {
                userId: user.id,
              },
            });
          }
          
          // Return user with therapistProfile (keep all profile data)
          return {
            ...user,
            therapistProfileId: therapistProfile.id, // For backward compatibility
            therapistProfile: therapistProfile, // Full profile data
          };
        })
      );
      
      return {
        success: true,
        data: therapistsWithProfiles,
      };
    } catch (error) {
      this.logger.error('Error fetching therapists:', error);
      throw error;
    }
  }

  /**
   * Remove password from user object
   */
  private sanitizeUser(user: User): UserDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, mfaSecret, ...sanitized } = user;
    return sanitized as UserDto;
  }
}
