import type { DbSdk } from '@libs/db-pg';
import type { BetterAuthOptions } from 'better-auth';
import type { SocialProviders } from 'better-auth/social-providers';

export interface CreateAuthOptions extends Pick<BetterAuthOptions, 'baseURL'> {
  db: DbSdk;
  socialProviders?: SocialProviders;
}

export const createAuthOptions = ({ db, socialProviders }: CreateAuthOptions) => {
  return {
    appName: 'Datanaut',
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...socialProviders,
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
