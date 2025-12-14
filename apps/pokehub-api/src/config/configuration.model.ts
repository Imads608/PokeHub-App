import type { PostgresDBConfiguration } from '@pokehub/backend/pokehub-postgres';
import type { JwtAppConfiguration } from '@pokehub/backend/shared-auth-utils';

export interface PokeHubApiConfiguration
  extends PostgresDBConfiguration,
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
