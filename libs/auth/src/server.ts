import type { DbSdk } from '@libs/db-pg';
import { betterAuth } from 'better-auth';

import { createAuthOptions } from './auth-options.ts';

export const createAuth = ({ db }: { db: DbSdk }) => {
  return betterAuth(createAuthOptions({ db }));
};
