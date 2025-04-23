import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';

import { createAuthOptions } from './auth-options.ts';

/**
 * URI doesn't matter, this file is only used by `@better-auth/cli generate`
 * to generate the drizzle schemas (in ./schema.ts).
 */
const db = drizzle('postgresql://postgres:postgres@localhost:5432/postgres');

export const auth = betterAuth({
  ...createAuthOptions({
    db: {} as any,
    loginPage: '/',
    basePath: '/api/auth',
    generateOrgData() {
      throw new Error('Unreachable');
    },
  }),
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
});
