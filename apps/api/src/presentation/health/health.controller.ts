import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe - Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - Checks dependencies' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    const checks = {
      database: false,
      redis: false,
    };

    const errors: string[] = [];

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      errors.push(`Database: ${error instanceof Error ? error.message : 'Connection failed'}`);
    }

    // Check Redis connection
    try {
      const redisClient = this.redis.getClient();
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.ping();
        checks.redis = true;
      } else {
        throw new Error('Redis client not ready');
      }
    } catch (error) {
      errors.push(`Redis: ${error instanceof Error ? error.message : 'Connection failed'}`);
    }

    const isReady = checks.database && checks.redis;

    if (!isReady) {
      throw new HttpException(
        {
          status: 'not_ready',
          checks,
          errors,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}

