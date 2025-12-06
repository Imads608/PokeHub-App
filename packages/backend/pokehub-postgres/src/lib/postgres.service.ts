import type { PostgresDBConfiguration } from './models/config.model';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const POSTGRES_SERVICE = 'POSTGRES_SERVICE';

export const postgresProvider = {
  provide: POSTGRES_SERVICE,
  useFactory: async (
    logger: AppLogger,
    configService: ConfigService<PostgresDBConfiguration, true>
  ) => {
    const dbCreds = configService.get('db', { infer: true });

    // Enable SSL in production, disable in development
    const isProd = process.env.NODE_ENV === 'production';

    // Build IPv4-compatible connection string
    const connectionString = `postgresql://${dbCreds.user}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.name}`;

    // Create connection pool using connection string
    const pool = new Pool({
      connectionString,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    });

    const db = drizzle(pool);
    await db.execute(sql`SELECT 1 as connected`);
    logger.log(`Successfully connected to DB: ${dbCreds.host} (SSL: ${isProd})`);
    return db;
  },
  inject: [AppLogger, ConfigService],
};

export type PostgresService = Awaited<
  ReturnType<typeof postgresProvider.useFactory>
>;
