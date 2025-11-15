import { Provider } from '@nestjs/common';
import { UserRepositoryImpl } from './repositories/user.repository.impl';
import { ClientRepositoryImpl } from './repositories/client.repository.impl';

// Repository injection tokens
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export const databaseProviders: Provider[] = [
  {
    provide: USER_REPOSITORY,
    useClass: UserRepositoryImpl,
  },
  {
    provide: CLIENT_REPOSITORY,
    useClass: ClientRepositoryImpl,
  },
];

