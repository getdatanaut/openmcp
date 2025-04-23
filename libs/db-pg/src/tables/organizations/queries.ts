import { OrganizationId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { type NewOrganization, ORGANIZATIONS_KEY } from './schema.ts';

export type OrganizationQueries = ReturnType<typeof organizationQueries>;

/**
 * Almost everything related to organizations is managed via the better-auth api
 */
export const organizationQueries = ({ db }: BuildQueriesOpts) => {
  function create(values: Omit<NewOrganization, 'id'>) {
    return db
      .insertInto(ORGANIZATIONS_KEY)
      .values({
        id: OrganizationId.generate(),
        ...values,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  return {
    create,
  };
};
