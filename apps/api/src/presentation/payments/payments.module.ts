import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { LoggerModule } from '../../infrastructure/logger';
import { PAYMENT_REPOSITORY } from '../../infrastructure/database/database.providers';
import { PaymentRepositoryImpl } from '../../infrastructure/database/repositories';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepositoryImpl,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}

