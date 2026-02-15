import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { HomeworkStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoggerService } from '../../infrastructure/logger';

@Injectable()
export class HomeworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(HomeworkService.name);
  }

  async findAll(filters?: {
    clientId?: string;
    sessionId?: string;
    status?: HomeworkStatus;
  }) {
    const where: any = {};
    
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    
    if (filters?.sessionId) {
      where.sessionId = filters.sessionId;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where,
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        client: {
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
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: submissions,
    };
  }

  async findByClientId(clientId: string, status?: HomeworkStatus) {
    // First get client profile ID from user ID
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: clientId },
    });

    if (!clientProfile) {
      throw new NotFoundException('Danışan profili bulunamadı');
    }

    const where: any = {
      clientId: clientProfile.id,
    };

    if (status) {
      where.status = status;
    }

    const submissions = await this.prisma.homeworkSubmission.findMany({
      where,
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: submissions,
    };
  }

  async findOne(id: string, userRole?: string, userId?: string) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        client: {
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
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Ev ödevi bulunamadı');
    }

    // CLIENT can only see their own homework
    if (userRole === UserRole.CLIENT) {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });
      if (clientProfile?.id !== submission.clientId) {
        throw new ForbiddenException('Bu ev ödevine erişim yetkiniz yok');
      }
    }

    return {
      success: true,
      data: submission,
    };
  }

  async create(dto: any, userId: string) {
    // Get client profile ID from user ID
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: dto.clientId || userId },
    });

    if (!clientProfile) {
      throw new NotFoundException('Danışan profili bulunamadı');
    }

    // Check if session exists
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Seans bulunamadı');
    }

    // Check if homework already exists for this session
    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: {
        sessionId: dto.sessionId,
        clientId: clientProfile.id,
      },
    });

    if (existing) {
      throw new BadRequestException('Bu seans için zaten bir ev ödevi kaydı var');
    }

    const submission = await this.prisma.homeworkSubmission.create({
      data: {
        sessionId: dto.sessionId,
        clientId: clientProfile.id,
        status: dto.status || HomeworkStatus.PENDING,
        notes: dto.notes,
        fileUrl: dto.fileUrl,
        submittedAt: dto.status === HomeworkStatus.COMPLETED ? new Date() : null,
      },
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    this.logger.info(`Homework submission created: ${submission.id}`);

    return {
      success: true,
      data: submission,
      message: 'Ev ödevi kaydı oluşturuldu',
    };
  }

  async update(id: string, dto: any, userRole?: string, userId?: string) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Ev ödevi bulunamadı');
    }

    // CLIENT can only update their own homework
    if (userRole === UserRole.CLIENT) {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });
      if (clientProfile?.id !== submission.clientId) {
        throw new ForbiddenException('Bu ev ödevini güncelleyemezsiniz');
      }
    }

    const updateData: any = {};

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      
      // Auto-set dates based on status
      if (dto.status === HomeworkStatus.COMPLETED && !submission.completedAt) {
        updateData.completedAt = new Date();
      }
      if (dto.status === HomeworkStatus.IN_PROGRESS && !submission.submittedAt) {
        updateData.submittedAt = new Date();
      }
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    if (dto.fileUrl !== undefined) {
      updateData.fileUrl = dto.fileUrl;
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id },
      data: updateData,
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    this.logger.info(`Homework submission updated: ${id}`);

    return {
      success: true,
      data: updated,
      message: 'Ev ödevi güncellendi',
    };
  }

  async complete(id: string, dto: { notes?: string; fileUrl?: string }, userId: string) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Ev ödevi bulunamadı');
    }

    // Verify client owns this homework
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (clientProfile?.id !== submission.clientId) {
      throw new ForbiddenException('Bu ev ödevini tamamlayamazsınız');
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id },
      data: {
        status: HomeworkStatus.COMPLETED,
        completedAt: new Date(),
        notes: dto.notes || submission.notes,
        fileUrl: dto.fileUrl || submission.fileUrl,
      },
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    this.logger.info(`Homework submission completed: ${id}`);

    return {
      success: true,
      data: updated,
      message: 'Ev ödevi tamamlandı olarak işaretlendi',
    };
  }

  async review(id: string, userId: string) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Ev ödevi bulunamadı');
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id },
      data: {
        status: HomeworkStatus.REVIEWED,
      },
      include: {
        session: {
          include: {
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    this.logger.info(`Homework submission reviewed: ${id}`);

    return {
      success: true,
      data: updated,
      message: 'Ev ödevi incelendi',
    };
  }

  // Activity methods
  async createActivity(homeworkId: string, dto: { title: string; description?: string; order?: number }) {
    // Verify homework exists
    const homework = await this.prisma.homeworkSubmission.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new NotFoundException('Ev ödevi bulunamadı');
    }

    // Get max order if not provided
    const maxOrder = dto.order ?? await this.prisma.homeworkActivity.count({
      where: { homeworkId },
    });

    const activity = await this.prisma.homeworkActivity.create({
      data: {
        homeworkId,
        title: dto.title,
        description: dto.description,
        order: maxOrder,
      },
    });

    this.logger.info(`Homework activity created: ${activity.id}`);

    return {
      success: true,
      data: activity,
      message: 'Etkinlik eklendi',
    };
  }

  async updateActivity(id: string, dto: { title?: string; description?: string; isCompleted?: boolean; order?: number }) {
    const activity = await this.prisma.homeworkActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException('Etkinlik bulunamadı');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.isCompleted !== undefined) {
      updateData.isCompleted = dto.isCompleted;
      if (dto.isCompleted && !activity.completedAt) {
        updateData.completedAt = new Date();
      } else if (!dto.isCompleted) {
        updateData.completedAt = null;
      }
    }

    const updated = await this.prisma.homeworkActivity.update({
      where: { id },
      data: updateData,
    });

    this.logger.info(`Homework activity updated: ${id}`);

    return {
      success: true,
      data: updated,
      message: 'Etkinlik güncellendi',
    };
  }

  async deleteActivity(id: string) {
    const activity = await this.prisma.homeworkActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException('Etkinlik bulunamadı');
    }

    await this.prisma.homeworkActivity.delete({
      where: { id },
    });

    this.logger.info(`Homework activity deleted: ${id}`);

    return {
      success: true,
      message: 'Etkinlik silindi',
    };
  }
}

