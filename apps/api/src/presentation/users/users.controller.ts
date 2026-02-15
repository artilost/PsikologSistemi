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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ProfilesService } from './profiles.service';
import { UpdateTherapistProfileDto, UpdateClientProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateUserDto } from '@psikolog/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
  ) { }

  @Get('therapists')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.THERAPIST, UserRole.CLIENT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get list of therapists' })
  @ApiResponse({ status: 200, description: 'Therapists retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTherapists() {
    return this.usersService.getTherapists();
  }

  @Get('deleted')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all deleted users' })
  @ApiResponse({ status: 200, description: 'Deleted users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllDeleted(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.findAllDeleted(pageNum, limitNum);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const includeDeletedBool = includeDeleted === 'true';
    return this.usersService.findAll(pageNum, limitNum, includeDeletedBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string, @Req() req: any) {
    // Prevent special routes from being treated as IDs
    if (id === 'deleted' || id === 'therapists') {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.usersService.update(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore soft-deleted user' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: String })
  async restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Patch('me/therapist-profile')
  @Roles(UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update current user therapist profile (onboarding)' })
  @ApiResponse({ status: 200, description: 'Therapist profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User must be a therapist' })
  async updateMyTherapistProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateTherapistProfileDto,
  ) {
    const profile = await this.profilesService.updateTherapistProfile(user.id, dto);
    return {
      success: true,
      data: profile,
      message: 'Terapist profili başarıyla güncellendi',
    };
  }

  @Patch('me/client-profile')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Update current user client profile (onboarding)' })
  @ApiResponse({ status: 200, description: 'Client profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User must be a client' })
  async updateMyClientProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateClientProfileDto,
  ) {
    const profile = await this.profilesService.updateClientProfile(user.id, dto);
    return {
      success: true,
      data: profile,
      message: 'Danışan profili başarıyla güncellendi',
    };
  }
}
