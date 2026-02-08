import type { PokeHubApiConfiguration } from './configuration.model';

export default (): PokeHubApiConfiguration => ({
  appName: 'PokeHubAPI',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    name: process.env.DB_NAME || 'pokehub',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || '',
    tls: process.env.REDIS_TLS === 'true',
  },
  secrets: {
    ACCESS_TOKEN: {
      value: process.env.ACCESS_TOKEN || 'access',
      expiryMinutes: process.env.ACCESS_TOKEN_EXPIRES
        ? parseInt(process.env.ACCESS_TOKEN_EXPIRES)
        : 60,
    },
    REFRESH_TOKEN: {
      value: process.env.REFRESH_TOKEN || 'refresh',
      expiryMinutes: process.env.REFRESH_TOKEN_EXPIRES
        ? parseInt(process.env.REFRESH_TOKEN_EXPIRES)
        : 60 * 12,
    },
  },
  googleOAuth: {
    clientId:
      process.env.GOOGLE_CLIENT_ID ||
      '490564752077-hlbp1k70hlsqo1quibgmcpetanscrpqu.apps.googleusercontent.com',
  },
  azure: {
    storageAccount: {
      name: process.env.AZURE_STORAGE_ACCOUNT || 'pokehub',
      avatarContainerName: process.env.AZURE_STORAGE_CONTAINER || 'avatars',
    },
  },
  teams: {
    maxTeamsPerUser: process.env.MAX_TEAMS_PER_USER
      ? parseInt(process.env.MAX_TEAMS_PER_USER, 10)
      : 5,
  },
});
