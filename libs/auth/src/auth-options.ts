import type { DbSdk } from '@libs/db-pg';
import type { BetterAuthOptions } from 'better-auth';

interface AuthOptions extends Pick<BetterAuthOptions, 'baseURL'> {
  db: DbSdk;
}

export const createAuthOptions = ({ db }: AuthOptions) => {
  return {
    appName: 'Datanaut',
    emailAndPassword: {
      enabled: true,
    },
    plugins: [],
    database: {
      db: db.client,
      type: 'postgres',
      casing: 'snake',
    },
    user: {
      modelName: 'users',
    },
    session: {
      modelName: 'userSessions',
    },
    account: {
      modelName: 'userAccounts',
    },
    verification: {
      modelName: 'authVerifications',
    },
  } as const satisfies BetterAuthOptions;
};
