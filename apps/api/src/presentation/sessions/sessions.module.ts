import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger';
import { SESSION_REPOSITORY } from '../../infrastructure/database/database.providers';
import { SessionRepositoryImpl } from '../../infrastructure/database/repositories';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    {
      provide: SESSION_REPOSITORY,
      useClass: SessionRepositoryImpl,
    },
  ],
  exports: [SessionsService],
})
export class SessionsModule {}

