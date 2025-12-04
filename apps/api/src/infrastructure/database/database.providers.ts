import { Provider } from '@nestjs/common';
import { UserRepositoryImpl } from './repositories/user.repository.impl';
import { ClientRepositoryImpl } from './repositories/client.repository.impl';
import { AppointmentRepositoryImpl } from './repositories/appointment.repository.impl';
import { SessionRepositoryImpl } from './repositories/session.repository.impl';
import { PaymentRepositoryImpl } from './repositories/payment.repository.impl';

// Repository injection tokens
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';
export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';
export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export const databaseProviders: Provider[] = [
  {
    provide: USER_REPOSITORY,
    useClass: UserRepositoryImpl,
  },
  {
    provide: CLIENT_REPOSITORY,
    useClass: ClientRepositoryImpl,
  },
  {
    provide: APPOINTMENT_REPOSITORY,
    useClass: AppointmentRepositoryImpl,
  },
  {
    provide: SESSION_REPOSITORY,
    useClass: SessionRepositoryImpl,
  },
  {
    provide: PAYMENT_REPOSITORY,
    useClass: PaymentRepositoryImpl,
  },
];

