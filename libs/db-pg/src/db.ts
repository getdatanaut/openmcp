import type { AUTH_VERIFICATIONS_KEY, AuthVerificationsTableCols } from './tables/auth-verifications/schema.ts';
import type { USER_ACCOUNTS_KEY, UserAccountsTableCols } from './tables/user-accounts/schema.ts';
import type { USER_SESSIONS_KEY, UserSessionsTableCols } from './tables/user-sessions/schema.ts';
import type { USERS_KEY, UsersTableCols } from './tables/users/schema.ts';

/**
 * Add all of the kysley table typings here.
 *
 * This is passed to kysley when creating a db client in sdk.ts.
 *
 * Please keep in alphabetical order.
 */
export interface DbSchema {
  [AUTH_VERIFICATIONS_KEY]: AuthVerificationsTableCols;
  [USER_ACCOUNTS_KEY]: UserAccountsTableCols;
  [USER_SESSIONS_KEY]: UserSessionsTableCols;
  [USERS_KEY]: UsersTableCols;
}
