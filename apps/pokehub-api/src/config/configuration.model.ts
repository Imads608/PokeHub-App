import type { PostgresDBConfiguration } from '@pokehub/backend/pokehub-postgres';
import type { RedisConfiguration } from '@pokehub/backend/pokehub-redis';
import type { JwtAppConfiguration } from '@pokehub/backend/shared-auth-utils';

export interface PokeHubApiConfiguration
  extends PostgresDBConfiguration,
    RedisConfiguration,
    JwtAppConfiguration {
  appName: string;
  googleOAuth: {
    clientId: string;
  };
  azure: {
    storageAccount: {
      name: string;
      avatarContainerName: string;
    };
  };
  teams: {
    maxTeamsPerUser: number;
  };
}
