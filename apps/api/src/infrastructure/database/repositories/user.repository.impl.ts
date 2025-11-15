import { Injectable } from '@nestjs/common';
import { User, UserRole, UserStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UserRepository } from '../../../domain/repositories/user.repository';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findAll(page = 1, limit = 20): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
    ]);

    return { data, total, page, limit };
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone, deletedAt: null },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateMfa(id: string, enabled: boolean, secret?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        mfaEnabled: enabled,
        mfaSecret: secret,
      },
    });
  }
}

