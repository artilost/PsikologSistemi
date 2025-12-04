import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'therapistId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'excludeScheduled', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('therapistId') therapistId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('excludeScheduled') excludeScheduled?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    // Convert excludeScheduled string to boolean
    // If excludeScheduled is 'false', set it to false (include SCHEDULED)
    // If excludeScheduled is 'true' or undefined, default to true (exclude SCHEDULED for therapists)
    const excludeScheduledBool = excludeScheduled === 'false' ? false : undefined;
    
    return this.appointmentsService.findAll(pageNum, limitNum, {
      therapistId,
      clientId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      excludeScheduled: excludeScheduledBool,
    });
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots for a therapist' })
  @ApiQuery({ name: 'therapistId', required: true, type: String })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({ name: 'duration', required: false, type: Number })
  async getAvailableSlots(
    @Query('therapistId') therapistId: string,
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      therapistId,
      new Date(date),
      duration ? parseInt(duration, 10) : 50,
    );
  }

  @Get('upcoming/:therapistId')
  @ApiOperation({ summary: 'Get upcoming appointments for a therapist' })
  @ApiParam({ name: 'therapistId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUpcoming(
    @Param('therapistId') therapistId: string,
    @Query('limit') limit?: string,
  ) {
    return this.appointmentsService.getUpcoming(
      therapistId,
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get('today/:therapistId')
  @ApiOperation({ summary: 'Get today\'s appointments for a therapist' })
  @ApiParam({ name: 'therapistId', type: String })
  async getTodaysAppointments(@Param('therapistId') therapistId: string) {
    return this.appointmentsService.getTodaysAppointments(therapistId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Time slot conflict' })
  async create(@Body() dto: any, @Req() req: any) {
    // For CLIENT role, ensure they can only create appointments for themselves
    if (req.user.role === UserRole.CLIENT) {
      // Get client profile ID from user
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        include: { clientProfile: true },
      });
      
      if (!user?.clientProfile) {
        throw new BadRequestException('Client profile not found');
      }
      
      // Override clientId to ensure CLIENT can only create for themselves
      dto.clientId = user.clientProfile.id;
    }

    // Convert therapist userId or therapistProfileId to therapistProfileId
    // Frontend may send either userId or therapistProfileId
    if (dto.therapistId) {
      // First, try to find by therapistProfileId (most common case)
      let therapistProfile = await this.prisma.therapistProfile.findUnique({
        where: { id: dto.therapistId },
        include: { user: true },
      });

      if (therapistProfile) {
        // It's already a therapistProfileId, use it directly
        dto.therapistId = therapistProfile.id;
      } else {
        // Try to find by userId
        const therapistUser = await this.prisma.user.findUnique({
          where: { id: dto.therapistId },
          include: { therapistProfile: true },
        });

        if (!therapistUser) {
          throw new BadRequestException('Terapist bulunamadı');
        }

        // If user has therapistProfile, use it
        if (therapistUser.therapistProfile) {
          dto.therapistId = therapistUser.therapistProfile.id;
        } else if (therapistUser.role === UserRole.ADMIN || therapistUser.role === UserRole.SUPER_ADMIN) {
          // For ADMIN/SUPER_ADMIN without therapistProfile, create one on the fly
          let newTherapistProfile = await this.prisma.therapistProfile.findFirst({
            where: { userId: therapistUser.id },
          });

          if (!newTherapistProfile) {
            // Create therapist profile for ADMIN/SUPER_ADMIN if they don't have one
            newTherapistProfile = await this.prisma.therapistProfile.create({
              data: {
                userId: therapistUser.id,
                specialization: ['Genel'],
                licenseNumber: 'ADMIN',
              },
            });
          }

          dto.therapistId = newTherapistProfile.id;
        } else {
          throw new BadRequestException('Seçilen kullanıcı bir terapist değil');
        }
      }
    }
    
    // Calculate duration if not provided
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const duration = dto.duration || Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    return this.appointmentsService.create({
      ...dto,
      userId: dto.userId || req.user.id,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      appointmentNotes: dto.appointmentNotes || dto.notes,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.appointmentsService.update(id, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiParam({ name: 'id', type: String })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: AppointmentStatus },
  ) {
    return this.appointmentsService.updateStatus(id, dto.status);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiParam({ name: 'id', type: String })
  async cancel(@Param('id') id: string, @Body() dto: { reason: string }) {
    return this.appointmentsService.cancel(id, dto.reason);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiParam({ name: 'id', type: String })
  async reschedule(
    @Param('id') id: string,
    @Body() dto: { startTime: string; endTime: string },
  ) {
    return this.appointmentsService.reschedule(
      id,
      new Date(dto.startTime),
      new Date(dto.endTime),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete appointment (soft delete)' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}

