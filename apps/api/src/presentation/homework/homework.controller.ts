import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('homework')
@Controller('homework')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get homework submissions' })
  @ApiResponse({ status: 200, description: 'Homework submissions retrieved successfully' })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('status') status?: string,
  ) {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // CLIENT can only see their own homework
    if (userRole === UserRole.CLIENT) {
      return this.homeworkService.findByClientId(userId, status as any);
    }

    return this.homeworkService.findAll({ clientId, sessionId, status: status as any });
  }

  @Get('my-homework')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get my homework submissions (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Homework submissions retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getMyHomework(@Req() req: any, @Query('status') status?: string) {
    return this.homeworkService.findByClientId(req.user?.id, status as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get homework submission by ID' })
  @ApiResponse({ status: 200, description: 'Homework submission retrieved successfully' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.homeworkService.findOne(id, req.user?.role, req.user?.id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Create homework submission' })
  @ApiResponse({ status: 201, description: 'Homework submission created successfully' })
  async create(@Body() dto: any, @Req() req: any) {
    return this.homeworkService.create({
      ...dto,
      clientId: dto.clientId || req.user?.id, // CLIENT uses their own ID
    }, req.user?.id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update homework submission' })
  @ApiResponse({ status: 200, description: 'Homework submission updated successfully' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.homeworkService.update(id, dto, req.user?.role, req.user?.id);
  }

  @Post(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Mark homework as completed' })
  @ApiResponse({ status: 200, description: 'Homework marked as completed' })
  @ApiParam({ name: 'id', type: String })
  async complete(@Param('id') id: string, @Body() dto: { notes?: string; fileUrl?: string }, @Req() req: any) {
    return this.homeworkService.complete(id, dto, req.user?.id);
  }

  @Post(':id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Review homework (THERAPIST only)' })
  @ApiResponse({ status: 200, description: 'Homework reviewed' })
  @ApiParam({ name: 'id', type: String })
  async review(@Param('id') id: string, @Req() req: any) {
    return this.homeworkService.review(id, req.user?.id);
  }

  // Activity endpoints
  @Post(':homeworkId/activities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Create homework activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiParam({ name: 'homeworkId', type: String })
  async createActivity(
    @Param('homeworkId') homeworkId: string,
    @Body() dto: { title: string; description?: string; order?: number },
  ) {
    return this.homeworkService.createActivity(homeworkId, dto);
  }

  @Patch('activities/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Update homework activity' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiParam({ name: 'id', type: String })
  async updateActivity(
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; isCompleted?: boolean; order?: number },
  ) {
    return this.homeworkService.updateActivity(id, dto);
  }

  @Delete('activities/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Delete homework activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiParam({ name: 'id', type: String })
  async deleteActivity(@Param('id') id: string) {
    return this.homeworkService.deleteActivity(id);
  }
}

