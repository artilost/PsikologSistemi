import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { ClientProfile, UserRole } from '@prisma/client';
import { ClientRepository } from '../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../infrastructure/database/database.providers';
import { LoggerService } from '../../infrastructure/logger';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(ClientsService.name);
  }

  async create(dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    occupation?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    therapistProfileId?: string;
  }): Promise<{
    success: boolean;
    data: ClientProfile;
    message: string;
    password?: string;
  }> {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email.toLowerCase(), mode: 'insensitive' } },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    // Generate random password if not provided
    const password = dto.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and client profile in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.CLIENT,
        },
      });

      // Create client profile
      const clientProfile = await tx.clientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          address: dto.address,
          occupation: dto.occupation,
          emergContact: dto.emergencyContact,
          emergPhone: dto.emergencyPhone,
          therapistProfileId: dto.therapistProfileId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
          therapistProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return clientProfile;
    });

    this.logger.info(`Client created: ${result.id}, email: ${dto.email}`);

    return {
      success: true,
      data: result,
      message: 'Danışan başarıyla oluşturuldu',
      password: dto.password ? undefined : password, // Return generated password only if not provided
    };
  }

  async findAll(page = 1, limit = 20, therapistId?: string): Promise<{
    success: boolean;
    data: ClientProfile[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // If therapistId is provided, filter clients by therapist
    const result = therapistId
      ? await this.clientRepository.findByTherapist(therapistId, page, limit)
      : await this.clientRepository.findAll(page, limit);

    this.logger.info(`Retrieved ${result.data.length} clients`, {
      page,
      limit,
      total: result.total,
      therapistId,
    });

    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findAllInactive(page = 1, limit = 20): Promise<{
    success: boolean;
    data: ClientProfile[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.clientRepository.findInactiveClients(page, limit);

    this.logger.info(`Retrieved ${result.data.length} inactive clients`, {
      page,
      limit,
      total: result.total,
    });

    return {
      success: true,
      data: result.data,
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
    data: ClientProfile;
  }> {
    const client = await this.clientRepository.findById(id);

    if (!client) {
      this.logger.warn(`Client not found: ${id}`);
      throw new NotFoundException('Danışan bulunamadı');
    }

    this.logger.info(`Retrieved client: ${id}`);

    return {
      success: true,
      data: client,
    };
  }

  async findByUserId(userId: string): Promise<{
    success: boolean;
    data: ClientProfile;
  }> {
    const client = await this.clientRepository.findByUserId(userId);

    if (!client) {
      throw new NotFoundException('Danışan profili bulunamadı');
    }

    return {
      success: true,
      data: client,
    };
  }

  async search(query: string, page = 1, limit = 20): Promise<{
    success: boolean;
    data: ClientProfile[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.clientRepository.searchClients(query, page, limit);

    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async update(id: string, dto: Partial<ClientProfile>, currentUser?: { id: string; role: string }): Promise<{
    success: boolean;
    data: ClientProfile;
    message: string;
  }> {
    const existingClient = await this.clientRepository.findById(id);

    if (!existingClient) {
      throw new NotFoundException('Danışan bulunamadı');
    }

    // Authorization check: only ADMIN, THERAPIST, or the client themselves can update
    if (currentUser && !['SUPER_ADMIN', 'ADMIN', 'THERAPIST'].includes(currentUser.role)) {
      if (existingClient.userId !== currentUser.id) {
        throw new ForbiddenException('Bu danışanı güncelleme yetkiniz yok');
      }
    }

    // If therapistProfileId is provided but looks like a user ID (not a therapistProfile ID),
    // try to find the therapistProfile by user ID
    const updateData = { ...dto };
    if (updateData.therapistProfileId !== undefined && updateData.therapistProfileId !== null) {
      // Try to find therapistProfile by userId first (in case frontend sends user ID)
      const therapistProfile = await this.prisma.therapistProfile.findFirst({
        where: {
          userId: updateData.therapistProfileId as string,
        },
      });

      if (therapistProfile) {
        // If found, use the therapistProfile.id instead
        updateData.therapistProfileId = therapistProfile.id;
      } else {
        // If not found, check if it's already a therapistProfile ID
        const existingTherapistProfile = await this.prisma.therapistProfile.findUnique({
          where: {
            id: updateData.therapistProfileId as string,
          },
        });

        if (!existingTherapistProfile) {
          throw new BadRequestException('Geçersiz terapist ID');
        }
      }
    } else if (updateData.therapistProfileId === null) {
      // Explicitly set to null to remove therapist assignment
      updateData.therapistProfileId = null;
    }

    const updatedClient = await this.clientRepository.update(id, updateData);

    this.logger.info(`Client updated: ${id}`);

    return {
      success: true,
      data: updatedClient,
      message: 'Danışan başarıyla güncellendi',
    };
  }

  async updateConsent(
    id: string,
    consentType: 'consent' | 'recording' | 'dataProcess',
    value: boolean,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const client = await this.clientRepository.findById(id);

    if (!client) {
      throw new NotFoundException('Danışan bulunamadı');
    }

    await this.clientRepository.updateConsent(id, consentType, value);

    this.logger.info(`Client consent updated: ${id}, type: ${consentType}, value: ${value}`);

    return {
      success: true,
      message: 'Onay durumu güncellendi',
    };
  }

  async remove(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const client = await this.clientRepository.findById(id);

    if (!client) {
      throw new NotFoundException('Danışan bulunamadı');
    }

    await this.clientRepository.softDelete(id);

    this.logger.warn(`Client soft deleted: ${id}`);

    return {
      success: true,
      message: 'Danışan başarıyla silindi',
    };
  }

  async restore(id: string): Promise<{
    success: boolean;
    data: ClientProfile;
    message: string;
  }> {
    await this.clientRepository.restore(id);

    const client = await this.clientRepository.findById(id);

    if (!client) {
      throw new NotFoundException('Danışan bulunamadı');
    }

    this.logger.info(`Client restored: ${id}`);

    return {
      success: true,
      data: client,
      message: 'Danışan başarıyla geri yüklendi',
    };
  }
}

