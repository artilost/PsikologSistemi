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
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PaymentStatus, PaymentMethod } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.paymentsService.findAll(pageNum, limitNum, { userId, status });
  }

  @Get('pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get pending payments' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getPendingPayments(@Query('userId') userId?: string) {
    return this.paymentsService.getPendingPayments(userId);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return this.paymentsService.getStats(start, end, userId);
  }

  @Get('revenue-by-method')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Get revenue by payment method' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getRevenueByMethod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getRevenueByMethod(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('by-session/:sessionId')
  @ApiOperation({ summary: 'Get payment by session ID' })
  @ApiParam({ name: 'sessionId', type: String })
  async findBySessionId(@Param('sessionId') sessionId: string) {
    return this.paymentsService.findBySessionId(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(@Body() dto: any, @Req() req: any) {
    return this.paymentsService.create({
      ...dto,
      userId: dto.userId || req.user.id,
    });
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.paymentsService.update(id, dto);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Process payment' })
  @ApiParam({ name: 'id', type: String })
  async processPayment(
    @Param('id') id: string,
    @Body() dto: { method: PaymentMethod; paidAmount: number },
  ) {
    return this.paymentsService.processPayment(id, dto);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Refund payment' })
  @ApiParam({ name: 'id', type: String })
  async refund(
    @Param('id') id: string,
    @Body() dto: { refundAmount: number; refundReason: string },
  ) {
    return this.paymentsService.refund(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete payment (soft delete)' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}

