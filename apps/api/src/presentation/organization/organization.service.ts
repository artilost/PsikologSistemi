import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

@Injectable()
export class OrganizationService {
    constructor(private prisma: PrismaService) { }

    async getSettings(organizationId: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                description: true,
                settings: true,
            },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        return {
            success: true,
            data: organization,
        };
    }

    async updateSettings(
        organizationId: string,
        dto: UpdateOrganizationSettingsDto,
    ) {
        // Get current settings
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { settings: true },
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        // Merge new settings with existing
        const currentSettings = (organization.settings as any) || {};
        const updatedSettings = {
            ...currentSettings,
            defaultTherapistSchedule: dto.defaultTherapistSchedule,
            defaultSessionDuration: dto.defaultSessionDuration,
        };

        // Update organization
        const updated = await this.prisma.organization.update({
            where: { id: organizationId },
            data: { settings: updatedSettings },
            select: {
                id: true,
                name: true,
                description: true,
                settings: true,
            },
        });

        return {
            success: true,
            data: updated,
            message: 'Organization settings updated successfully',
        };
    }

    async getDefaultTherapistSchedule(organizationId: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { settings: true },
        });

        if (!organization || !organization.settings) {
            return null;
        }

        const settings = organization.settings as any;
        return {
            workingHours: settings.defaultTherapistSchedule || null,
            sessionDuration: settings.defaultSessionDuration || 50,
        };
    }
}
