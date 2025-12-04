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
import { join } from 'path';

// Get absolute path to the api directory (where this file is located)
// __dirname points to: apps/api/src/infrastructure/config (or dist/infrastructure/config)
// We need to go up to: apps/api
const apiRoot = join(__dirname, '..', '..', '..');

// Determine env file paths based on NODE_ENV
// .env.test should only be used in test environment
const getEnvFilePaths = () => {
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isTest) {
    return [
      join(apiRoot, '.env.test'),
      join(apiRoot, '.env'),
    ];
  }
  
  // For development/production: .env.local takes priority, then .env
  return [
    join(apiRoot, '.env.local'),
    join(apiRoot, '.env'),
  ];
};

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths(),
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
export class ConfigModule { }

