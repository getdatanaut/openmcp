import { dropSchemaTables } from '@libs/db-pg-migrations';

const reset = async () => {
  const dbUrl = process.env['DN_PG_URL']!;

  if (!dbUrl.includes('localhost')) {
    throw new Error('Reset may only be run against a database running on localhost.');
  }

  await dropSchemaTables({ dbUrl });

  // Uncomment when we start comitting migration files
  // await migrateToLatest({ dbUrl: process.env['DN_PG_URL']!, migrationsFolder: 'migrations' });
};

await reset();

process.exit();
