import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER } from '@nestjs/core';
import { HttpLoggerMiddleware } from './infrastructure/logger/http-logger.middleware';

// Infrastructure
import { ConfigModule } from './infrastructure/config/config.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { HttpExceptionFilter, ZodValidationFilter } from './infrastructure/exceptions';

// Core modules
import { AuthModule } from './presentation/auth/auth.module';
import { UsersModule } from './presentation/users/users.module';
import { ClientsModule } from './presentation/clients/clients.module';
import { AppointmentsModule } from './presentation/appointments/appointments.module';
import { SessionsModule } from './presentation/sessions/sessions.module';
import { PaymentsModule } from './presentation/payments/payments.module';
import { ReportsModule } from './presentation/reports/reports.module';
import { OrganizationModule } from './presentation/organization/organization.module';

// Shared
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    // Configuration (Global)
    ConfigModule,

    // Rate limiting (Dynamic from config)
    ThrottlerModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60) * 1000,
          limit: configService.get<number>('throttle.limit', 100),
        },
      ],
    }),

    // Scheduling (for cron jobs, reminders, etc.)
    ScheduleModule.forRoot(),

    // Infrastructure
    PrismaModule,
    RedisModule,
    LoggerModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ClientsModule,
    AppointmentsModule,
    SessionsModule,
    PaymentsModule,
    ReportsModule,
    OrganizationModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global exception filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}

