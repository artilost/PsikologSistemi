import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import {
  appConfig,
  databaseConfig,
  authConfig,
  corsConfig,
  redisConfig,
  smtpConfig,
  throttleConfig,
  logConfig,
  securityConfig,
} from './configuration';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        corsConfig,
        redisConfig,
        smtpConfig,
        throttleConfig,
        logConfig,
        securityConfig,
      ],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}

