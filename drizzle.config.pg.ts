import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// Determine SSL configuration based on environment
const useSSL = process.env.DB_SSL === 'true';

export default defineConfig({
  out: './drizzle',
  schema: [
    'packages/backend/pokehub-users-db/src/lib/schema',
    'packages/backend/pokehub-teams-db/src/lib/schema',
  ],
  dialect: 'postgresql',
  dbCredentials: {
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME || 'pokehub',
  },
});
