import type { Provider } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TEAMS_SERVICE } from './teams.service.interface';

export const TeamsServiceProvider: Provider = {
  provide: TEAMS_SERVICE,
  useClass: TeamsService,
};
