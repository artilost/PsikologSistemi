import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { databaseProviders } from './database.providers';

@Global()
@Module({
  providers: [PrismaService, ...databaseProviders],
  exports: [PrismaService, ...databaseProviders],
})
export class PrismaModule {}

