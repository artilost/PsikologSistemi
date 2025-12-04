import { Injectable } from '@nestjs/common';
import { ClientProfile, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ClientRepository } from '../../../domain/repositories/client.repository';

@Injectable()
export class ClientRepositoryImpl implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ClientProfile | null> {
    return this.prisma.clientProfile.findUnique({
      where: { id },
      include: { 
        user: true,
        therapistProfile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 20): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    // Only return active clients (isActive: true or null/undefined which defaults to true)
    // Same logic as users: list() returns only active, listDeleted() returns only inactive
    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where: {
          isActive: true, // Only active clients
          user: {
            role: 'CLIENT', // Only return clients with CLIENT role
            deletedAt: null,
          },
        },
        skip,
        take: limit,
        include: { 
          user: true,
          therapistProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientProfile.count({
        where: {
          isActive: true, // Only active clients
          user: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async create(data: Prisma.ClientProfileCreateInput): Promise<ClientProfile> {
    return this.prisma.clientProfile.create({
      data,
      include: { user: true },
    });
  }

  async update(id: string, data: Prisma.ClientProfileUpdateInput): Promise<ClientProfile> {
    return this.prisma.clientProfile.update({
      where: { id },
      data,
      include: { 
        user: true,
        therapistProfile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.clientProfile.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.clientProfile.count({ where: { id } });
    return count > 0;
  }

  async findByUserId(userId: string): Promise<ClientProfile | null> {
    return this.prisma.clientProfile.findUnique({
      where: { userId },
      include: { 
        user: true,
        therapistProfile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findActiveClients(page = 1, limit = 20): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where: {
          isActive: true,
          user: {
            role: 'CLIENT', // Only return clients with CLIENT role
            deletedAt: null,
          },
        },
        skip,
        take: limit,
        include: { 
          user: true,
          therapistProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientProfile.count({
        where: {
          isActive: true,
          user: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async findInactiveClients(page = 1, limit = 20): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where: {
          isActive: false,
          user: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
        skip,
        take: limit,
        include: { 
          user: true,
          therapistProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientProfile.count({
        where: {
          isActive: false,
          user: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async searchClients(query: string, page = 1, limit = 20): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where: {
          user: {
            role: 'CLIENT', // Only return clients with CLIENT role
            deletedAt: null,
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
        skip,
        take: limit,
        include: { 
          user: true,
          therapistProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientProfile.count({
        where: {
          user: {
            role: 'CLIENT',
            deletedAt: null,
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async findByTherapist(therapistId: string, page = 1, limit = 20): Promise<{
    data: ClientProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.clientProfile.findMany({
        where: {
          therapistProfileId: therapistId,
          user: {
            role: 'CLIENT', // Only return clients with CLIENT role
            deletedAt: null,
          },
        },
        skip,
        take: limit,
        include: { 
          user: true,
          therapistProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clientProfile.count({
        where: {
          therapistProfileId: therapistId,
          user: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async updateConsent(
    id: string,
    consentType: 'consent' | 'recording' | 'dataProcess',
    value: boolean,
  ): Promise<void> {
    const updateData: Prisma.ClientProfileUpdateInput = {};

    switch (consentType) {
      case 'consent':
        updateData.consentSigned = value;
        if (value) {
          updateData.consentSignedAt = new Date();
        }
        break;
      case 'recording':
        updateData.recordingConsent = value;
        break;
      case 'dataProcess':
        updateData.dataProcessConsent = value;
        break;
    }

    await this.prisma.clientProfile.update({
      where: { id },
      data: updateData,
    });
  }
}

