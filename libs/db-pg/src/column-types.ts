import { timestamp } from 'drizzle-orm/pg-core';

/**
 * @example
 * const columns = {
 *   createdAt: timestampCol('created_at').notNull().defaultNow(),
 *   updatedAt: timestampCol('updated_at').defaultNow(),
 * }
 */
export const timestampCol = <TName extends string>(dbName: TName) =>
  timestamp(dbName, { withTimezone: true, mode: 'date' });

/**
 * @example
 * const columns = {
 *   createdAt: timestampCol('created_at').notNull().defaultNow(),
 *   updatedAt: timestampCol('updated_at').defaultNow(),
 * }
 */
export const timestamp64Col = <TName extends string>(dbName: TName) =>
  timestamp(dbName, { withTimezone: true, mode: 'date', precision: 6 });
