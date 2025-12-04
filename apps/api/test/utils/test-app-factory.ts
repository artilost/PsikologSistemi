import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Configure app like in main.ts
  // Only set global prefix, no versioning (already handled by controller decorators)
  app.setGlobalPrefix('api/v1');

  // Add global pipes
  app.useGlobalPipes(new ZodValidationPipe());

  try {
    await app.init();
  } catch (error) {
    console.error('Failed to initialize test app:', error);
    throw error;
  }
  
  return app;
}

