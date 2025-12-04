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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, SessionNoteStatus } from '@prisma/client';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'therapistId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'noteStatus', required: false, enum: SessionNoteStatus })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('therapistId') therapistId?: string,
    @Query('clientId') clientId?: string,
    @Query('noteStatus') noteStatus?: SessionNoteStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.sessionsService.findAll(pageNum, limitNum, {
      therapistId,
      clientId,
      noteStatus,
    });
  }

  @Get('drafts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get draft sessions' })
  @ApiQuery({ name: 'therapistId', required: false, type: String })
  async getDraftSessions(@Query('therapistId') therapistId?: string) {
    return this.sessionsService.getDraftSessions(therapistId);
  }

  @Get('by-appointment/:appointmentId')
  @ApiOperation({ summary: 'Get session by appointment ID' })
  @ApiParam({ name: 'appointmentId', type: String })
  async findByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return this.sessionsService.findByAppointmentId(appointmentId);
  }

  @Get('client-history/:clientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get client session history' })
  @ApiParam({ name: 'clientId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getClientHistory(
    @Param('clientId') clientId: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.getClientHistory(
      clientId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('stats/:therapistId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get therapist session statistics' })
  @ApiParam({ name: 'therapistId', type: String })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getTherapistStats(
    @Param('therapistId') therapistId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.sessionsService.getTherapistStats(
      therapistId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async create(@Body() dto: any, @Req() req: any) {
    return this.sessionsService.create({
      ...dto,
      userId: dto.userId || req.user.id,
      actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
      actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
    });
  }

  @Patch(':id/notes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update session notes' })
  @ApiResponse({ status: 200, description: 'Notes updated successfully' })
  @ApiParam({ name: 'id', type: String })
  async updateNotes(@Param('id') id: string, @Body() dto: any) {
    return this.sessionsService.updateNotes(id, dto);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Sign session notes' })
  @ApiParam({ name: 'id', type: String })
  async signSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.signSession(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete session (soft delete)' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}

