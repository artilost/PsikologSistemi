import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) { }

    @Get('settings')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async getSettings(@Req() req: any) {
        const organizationId = req.user.organizationId;
        return this.organizationService.getSettings(organizationId);
    }

    @Patch('settings')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async updateSettings(
        @Req() req: any,
        @Body() dto: UpdateOrganizationSettingsDto,
    ) {
        const organizationId = req.user.organizationId;
        return this.organizationService.updateSettings(organizationId, dto);
    }
}
