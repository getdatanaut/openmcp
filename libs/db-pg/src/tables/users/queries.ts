import { type TUserId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import type { UserColNames } from './schema.ts';
import { USERS_KEY } from './schema.ts';

export type UserQueries = ReturnType<typeof userQueries>;

export const userQueries = ({ db }: BuildQueriesOpts) => {
  function byId({ id }: { id: TUserId }) {
    return db.selectFrom(USERS_KEY).select(detailedSelect).where('id', '=', id).executeTakeFirstOrThrow();
  }

  return {
    byId,
  };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = ['id', 'name', 'email', 'image', 'createdAt', 'updatedAt'] satisfies UserColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect] satisfies UserColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
