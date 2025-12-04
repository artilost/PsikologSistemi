import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    occupation?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    therapistProfileId?: string;
  }) {
    return this.clientsService.create({
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
    });
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'therapistId', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('therapistId') therapistId?: string,
    @Req() req?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    // For THERAPIST role, automatically filter by their therapistProfileId
    let filterTherapistId = therapistId;
    if (req?.user?.role === 'THERAPIST' && req?.user?.therapistProfileId) {
      filterTherapistId = req.user.therapistProfileId;
    }
    
    return this.clientsService.findAll(pageNum, limitNum, filterTherapistId);
  }

  @Get('deleted')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all inactive (deleted) clients' })
  @ApiResponse({ status: 200, description: 'Inactive clients retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllInactive(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.clientsService.findAllInactive(pageNum, limitNum);
  }

  @Get('search')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Search clients' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.clientsService.search(query, pageNum, limitNum);
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Get client by user ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'userId', type: String })
  async findByUserId(@Param('userId') userId: string) {
    return this.clientsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.clientsService.update(id, dto, req.user);
  }

  @Patch(':id/consent')
  @ApiOperation({ summary: 'Update client consent' })
  @ApiResponse({ status: 200, description: 'Consent updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async updateConsent(
    @Param('id') id: string,
    @Body() dto: { consentType: 'consent' | 'recording' | 'dataProcess'; value: boolean },
  ) {
    return this.clientsService.updateConsent(id, dto.consentType, dto.value);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete client (soft delete)' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore soft-deleted client' })
  @ApiResponse({ status: 200, description: 'Client restored successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiParam({ name: 'id', type: String })
  async restore(@Param('id') id: string) {
    return this.clientsService.restore(id);
  }
}

