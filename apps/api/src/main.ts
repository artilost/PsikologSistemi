import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const corsOrigin = configService.get<string[]>('cors.origin', ['http://localhost:3000']);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global prefix - versioning zaten prefix'te
  app.setGlobalPrefix(apiPrefix);

  // Global pipes
  app.useGlobalPipes(new ZodValidationPipe());

  // Swagger documentation
  if (nodeEnv !== 'production') {
    // Patch NestJS Swagger to work with Zod schemas
    patchNestJsSwagger();

    const config = new DocumentBuilder()
      .setTitle('Psychology Practice Management API')
      .setDescription('Enterprise-grade API for psychology practice management')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User Management')
      .addTag('clients', 'Client/Patient Management')
      .addTag('appointments', 'Appointment Scheduling')
      .addTag('sessions', 'Therapy Sessions & Notes')
      .addTag('payments', 'Billing & Payments')
      .addTag('reports', 'Analytics & Reports')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
    });
  }

  await app.listen(port);
  console.log(`🚀 API running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();

