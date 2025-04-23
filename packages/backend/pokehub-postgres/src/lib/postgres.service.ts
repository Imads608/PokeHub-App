import type { PostgresDBConfiguration } from './models/config.model';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

export const POSTGRES_SERVICE = 'POSTGRES_SERVICE';

export const postgresProvider = {
  provide: POSTGRES_SERVICE,
  useFactory: async (
    logger: AppLogger,
    configService: ConfigService<PostgresDBConfiguration, true>
  ) => {
    const dbCreds = configService.get('db', { infer: true });
    const connString = `postgress://${dbCreds.user}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.name}`;
    const db = drizzle(connString);
    await db.execute(sql`SELECT 1 as connected`);
    logger.log(`Successfully connected to DB: ${connString}`);
    return db;
  },
  inject: [AppLogger, ConfigService],
};

export type PostgresService = Awaited<
  ReturnType<typeof postgresProvider.useFactory>
>;
