import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const USERS_TABLE = 'users';

export const accountRoleEnum = pgEnum('account_role', ['ADMIN', 'USER']);
export const accountTypeEnum = pgEnum('account_type', ['GOOGLE']);

export const usersTable = pgTable(USERS_TABLE, {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique(),
  email: text('email').notNull().unique(),
  accountRole: accountRoleEnum('accountRole').notNull().default('USER'),
  accountType: accountTypeEnum('accountType').notNull(),
});

export type User = typeof usersTable.$inferSelect;
