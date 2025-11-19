import { pgTable, uuid, varchar, integer, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { usersTable } from '@pokehub/backend/pokehub-users-db';
import type { PokemonInTeam } from '@pokehub/shared/shared-team-models';

// PostgreSQL enum for battle format
export const battleFormatEnum = pgEnum('battle_format', ['Singles', 'Doubles']);

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    generation: integer('generation').notNull(), // Validated by Zod: 1-9
    format: battleFormatEnum('format').notNull(),
    tier: varchar('tier', { length: 50 }).notNull(), // Validated by Zod against Tier types
    pokemon: jsonb('pokemon').notNull().$type<PokemonInTeam[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_teams_user_id').on(table.userId),
    createdAtIdx: index('idx_teams_created_at').on(table.createdAt),
    // Composite index for efficient user team listing with optional generation filter
    userListIdx: index('idx_teams_user_list').on(
      table.userId,
      table.generation,
      table.createdAt.desc()
    ),
  })
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
