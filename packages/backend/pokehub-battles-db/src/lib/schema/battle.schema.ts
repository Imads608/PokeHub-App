import { usersTable } from '@pokehub/backend/pokehub-users-db';
import { teams } from '@pokehub/backend/pokehub-teams-db';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Saved battle replays.
 * Records are only created when a user explicitly saves a replay.
 */
export const battleReplays = pgTable(
  'battle_replays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Original battle ID from Redis */
    battleId: varchar('battle_id', { length: 100 }).notNull(),
    /** User who saved this replay */
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    /** Full Showdown format ID (e.g., 'gen9ou') */
    format: varchar('format', { length: 50 }).notNull(),
    player1Id: uuid('player1_id')
      .notNull()
      .references(() => usersTable.id),
    player2Id: uuid('player2_id')
      .notNull()
      .references(() => usersTable.id),
    player1TeamId: uuid('player1_team_id')
      .notNull()
      .references(() => teams.id),
    player2TeamId: uuid('player2_team_id')
      .notNull()
      .references(() => teams.id),
    /** Winner's user ID, or null for draw */
    winnerId: uuid('winner_id').references(() => usersTable.id),
    /** Battle input log for replay */
    battleLog: jsonb('battle_log').notNull().$type<string[]>(),
    /** PRNG seed for deterministic replay */
    seed: varchar('seed', { length: 100 }).notNull(),
    /** When the battle was played */
    playedAt: timestamp('played_at').notNull(),
    /** When the replay was saved */
    savedAt: timestamp('saved_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_battle_replays_user').on(table.userId),
    index('idx_battle_replays_battle').on(table.battleId),
    index('idx_battle_replays_saved_at').on(table.savedAt.desc()),
  ]
);

export type BattleReplay = typeof battleReplays.$inferSelect;
export type NewBattleReplay = typeof battleReplays.$inferInsert;
