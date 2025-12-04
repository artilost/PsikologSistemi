import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt.guard';
import {
  LoginDto,
  CreateUserDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

type AuthenticatedRequest = ExpressRequest & {
  user: {
    id: string;
    email: string;
    role: string;
    avatar?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    [key: string]: unknown;
  };
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(OptionalJwtAuthGuard) // Optional auth - allows request even without token
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account. If role is provided and not CLIENT, requires ADMIN/SUPER_ADMIN authentication. Without role, creates CLIENT by default.'
  })
  @ApiBody({ 
    type: CreateUserDto,
    description: 'User registration details',
    examples: {
      therapist: {
        summary: 'Therapist Registration (Admin only)',
        value: {
          email: 'therapist@example.com',
          password: 'SecurePass123!',
          firstName: 'Ayşe',
          lastName: 'Yılmaz',
          phone: '+905551234567',
          role: 'THERAPIST',
        },
      },
      admin: {
        summary: 'Admin Registration (Super Admin only)',
        value: {
          email: 'admin@example.com',
          password: 'AdminPass123!',
          firstName: 'Mehmet',
          lastName: 'Demir',
          phone: '+905559876543',
          role: 'ADMIN',
        },
      },
      client: {
        summary: 'Client Registration (Public)',
        value: {
          email: 'client@example.com',
          password: 'ClientPass123!',
          firstName: 'Ali',
          lastName: 'Veli',
          phone: '+905551111111',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Role assignment requires admin privileges' })
  async register(@Body() dto: CreateUserDto, @Request() req: ExpressRequest) {
    // If role is provided and it's not CLIENT, require authentication
    if (dto.role && dto.role !== 'CLIENT') {
      const authReq = req as AuthenticatedRequest;
      // Debug: Log request details
      console.log('Register request - User:', authReq.user);
      console.log('Register request - Role:', dto.role);
      console.log('Register request - Headers:', req.headers?.authorization ? 'Token present' : 'No token');
      
      // Check if user is authenticated and has admin role
      if (!authReq.user) {
        throw new ForbiddenException('Authentication required to create users with non-CLIENT roles');
      }
      
      // Check role using UserRole enum
      const userRole = authReq.user.role as string;
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        console.log('User role check failed:', { userRole, allowed: ['ADMIN', 'SUPER_ADMIN'] });
        throw new ForbiddenException('Only admins can create users with non-CLIENT roles');
      }
    }
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ 
    summary: 'Login with email and password',
    description: 'Authenticate user and receive access token'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'Login credentials',
    examples: {
      default: {
        summary: 'Example Login',
        value: {
          email: 'user@example.com',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}

