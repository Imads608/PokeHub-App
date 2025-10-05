import { Provider } from '@nestjs/common';
import { UsersService } from './users.service';
import { USERS_SERVICE } from './users.service.interface';

export const UsersServiceProvider: Provider = {
  provide: USERS_SERVICE,
  useClass: UsersService,
};
