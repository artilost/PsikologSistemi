import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger';
import { CLIENT_REPOSITORY } from '../../infrastructure/database/database.providers';
import { ClientRepositoryImpl } from '../../infrastructure/database/repositories';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    {
      provide: CLIENT_REPOSITORY,
      useClass: ClientRepositoryImpl,
    },
  ],
  exports: [ClientsService],
})
export class ClientsModule {}

