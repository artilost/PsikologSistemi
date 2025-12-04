import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger';
import { APPOINTMENT_REPOSITORY } from '../../infrastructure/database/database.providers';
import { AppointmentRepositoryImpl } from '../../infrastructure/database/repositories';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: AppointmentRepositoryImpl,
    },
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

