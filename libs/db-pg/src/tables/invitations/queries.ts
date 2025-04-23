import type { BuildQueriesOpts } from '../../types.ts';

export type InvitationQueries = ReturnType<typeof invitationQueries>;

/**
 * Almost everything related to invitations is managed via the better-auth api
 */
export const invitationQueries = (_: BuildQueriesOpts) => {
  return {};
};
