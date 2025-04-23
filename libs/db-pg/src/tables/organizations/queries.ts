import type { BuildQueriesOpts } from '../../types.ts';

export type OrganizationQueries = ReturnType<typeof organizationQueries>;

/**
 * Almost everything related to organizations is managed via the better-auth api
 */
export const organizationQueries = (_: BuildQueriesOpts) => {
  return {};
};
