import type { BetterAuthOptions } from 'better-auth';

export const authOptions = {
  appName: 'Datanaut',
  plugins: [],
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
} satisfies BetterAuthOptions;
