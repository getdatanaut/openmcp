import { type TOrganizationId, type TUserId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { MEMBERS_KEY } from '../members/schema.ts';
import type { UserColNames } from './schema.ts';
import { USERS_KEY } from './schema.ts';

export type UserQueries = ReturnType<typeof userQueries>;

export const userQueries = ({ db }: BuildQueriesOpts) => {
  function byId({ id }: { id: TUserId }) {
    return db.selectFrom(USERS_KEY).select(detailedSelect).where('id', '=', id).executeTakeFirstOrThrow();
  }

  /**
   * Get the organization id of the user's active organization.
   *
   * This is the organization that the user is currently a member of.
   * If none is set, it'll be the first organization in the list.
   * If the user is not a member of any organization, then this will return null.
   '
   * @param values
   */
  function getActiveOrganizationId({ userId }: { userId: TUserId }): Promise<TOrganizationId | null> {
    return db
      .selectFrom(USERS_KEY)
      .leftJoinLateral(
        eb =>
          eb
            .selectFrom(MEMBERS_KEY)
            .select('organizationId')
            .whereRef(`${USERS_KEY}.id`, '=', `${MEMBERS_KEY}.userId`)
            .as('member'),
        join => join.onTrue(),
      )
      .where('id', '=', userId)
      .select(['activeOrganizationId', 'member.organizationId'])
      .executeTakeFirst()
      .then(result => result?.activeOrganizationId ?? result?.organizationId ?? null);
  }

  return {
    byId,
    getActiveOrganizationId,
  };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'name',
  'email',
  'emailVerified',
  'image',
  'createdAt',
  'updatedAt',
] satisfies UserColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect] satisfies UserColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
