import { usersTable } from '@pokehub/backend/pokehub-users-db';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    generation: integer('generation').notNull(),
    format: varchar('format', { length: 50 }).notNull(), // Showdown format ID
    pokemon: jsonb('pokemon').notNull().$type<PokemonInTeam[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_teams_user_id').on(table.userId),
    index('idx_teams_created_at').on(table.createdAt),
    index('idx_teams_user_list').on(
      table.userId,
      table.generation,
      table.createdAt.desc()
    ),
  ]
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
