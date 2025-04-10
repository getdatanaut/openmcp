import { createRequire } from 'node:module';
import * as path from 'node:path';

import type { Config } from 'drizzle-kit';

const require = createRequire(import.meta.url);

export default {
  schema: path.resolve(require.resolve('@libs/db-pg'), '../schema.ts'),
  dialect: 'postgresql',
  out: 'migrations',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env['DN_PG_URL']!,
  },
} satisfies Config;
