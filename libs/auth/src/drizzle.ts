import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';

import { authOptions } from './auth-options.ts';

/**
 * URI doesn't matter, this file is only used by `@better-auth/cli generate`
 * to generate the drizzle schemas (in ./schema.ts).
 */
const db = drizzle('postgresql://postgres:postgres@localhost:5432/postgres');

export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
});
