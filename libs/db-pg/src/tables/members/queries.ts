import { MemberId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { MEMBERS_KEY, type NewMember } from './schema.ts';

export type MemberQueries = ReturnType<typeof memberQueries>;

/**
 * Almost everything related to members is managed via the better-auth api
 */
export const memberQueries = ({ db }: BuildQueriesOpts) => {
  function create(values: Omit<NewMember, 'id'>) {
    return db
      .insertInto(MEMBERS_KEY)
      .values({
        id: MemberId.generate(),
        ...values,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  return {
    create,
  };
};
