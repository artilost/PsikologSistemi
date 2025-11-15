import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../infrastructure/database/database.providers';
import { UpdateUserDto, UserDto } from '@psikolog/shared';
import { DuplicateEmailException, DuplicatePhoneException } from '../../infrastructure/exceptions';
import { LoggerService } from '../../infrastructure/logger';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async findAll(page = 1, limit = 20): Promise<{
    success: boolean;
    data: UserDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.userRepository.findAll(page, limit);

    this.logger.info(`Retrieved ${result.data.length} users`, {
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

  async findOne(id: string): Promise<{
    success: boolean;
    data: UserDto;
  }> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    this.logger.info(`Retrieved user: ${user.email}`);

    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<{
    success: boolean;
    data: UserDto;
    message: string;
  }> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Kullanıcı bulunamadı');
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
   * Remove password from user object
   */
  private sanitizeUser(user: User): UserDto {
    const { password, mfaSecret, ...sanitized } = user;
    return sanitized as UserDto;
  }
}
