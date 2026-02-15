import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UpdateTherapistProfileDto, UpdateClientProfileDto } from './dto';

@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) { }

    async updateTherapistProfile(userId: string, dto: UpdateTherapistProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { therapistProfile: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.therapistProfile) {
            // Create if not exists (should exist from registration/seed, but safe fallback)
            return this.prisma.therapistProfile.create({
                data: {
                    userId,
                    ...dto,
                },
            });
        }

        return this.prisma.therapistProfile.update({
            where: { userId },
            data: dto,
        });
    }

    async updateClientProfile(userId: string, dto: UpdateClientProfileDto) {
        console.log(`[ProfilesService] Updating client profile for user: ${userId}`, dto);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { clientProfile: true },
        });

        if (!user) {
            console.error(`[ProfilesService] User not found: ${userId}`);
            throw new NotFoundException('User not found');
        }

        let dateOfBirth: Date | undefined;
        if (dto.dateOfBirth) {
            const date = new Date(dto.dateOfBirth);
            if (!isNaN(date.getTime())) {
                dateOfBirth = date;
            } else {
                console.warn(`[ProfilesService] Invalid date format for user ${userId}: ${dto.dateOfBirth}`);
            }
        }

        const data = {
            ...dto,
            dateOfBirth,
        };

        try {
            if (!user.clientProfile) {
                console.log(`[ProfilesService] Creating new client profile for user: ${userId}`);
                return await this.prisma.clientProfile.create({
                    data: {
                        userId,
                        ...data,
                    },
                });
            }

            console.log(`[ProfilesService] Updating existing client profile for user: ${userId}`);
            return await this.prisma.clientProfile.update({
                where: { userId },
                data,
            });
        } catch (error) {
            console.error(`[ProfilesService] Database error updating profile for user ${userId}:`, error);
            throw error;
        }
    }
}
