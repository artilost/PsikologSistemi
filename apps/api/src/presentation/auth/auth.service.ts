import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { UserRole, UserStatus } from '@prisma/client';
import { CreateUserDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: CreateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? UserRole.CLIENT,
        status: UserStatus.PENDING_VERIFICATION,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    return {
      success: true,
      message: 'Registration successful',
      data: user,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('auth.jwtRefresh.expiresIn', '30d'),
      secret: this.configService.get<string>('auth.jwtRefresh.secret'),
    });

    // Store refresh token in Redis
    await this.redisService.set(
      `refresh_token:${user.id}`,
      refreshToken,
      30 * 24 * 60 * 60, // 30 days in seconds
    );

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      // Verify token exists in Redis
      const storedToken = await this.redisService.get(`refresh_token:${payload.sub}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        success: true,
        data: {
          accessToken,
          expiresIn: 7 * 24 * 60 * 60,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        therapistProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  async logout(userId: string) {
    // Remove refresh token from Redis
    await this.redisService.del(`refresh_token:${userId}`);

    this.logger.log(`User logged out: ${userId}`);

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
      };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    // Store in Redis with 1 hour TTL
    await this.redisService.set(`reset_token:${user.id}`, resetToken, 60 * 60);

    // TODO: Send email with reset link
    this.logger.log(`Password reset requested for: ${email}`);

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
      // In development, return token
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      // Verify token exists in Redis
      const storedToken = await this.redisService.get(`reset_token:${payload.sub}`);
      
      if (!storedToken || storedToken !== token) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      // Remove reset token
      await this.redisService.del(`reset_token:${payload.sub}`);

      this.logger.log(`Password reset successful for user: ${payload.sub}`);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }
}

