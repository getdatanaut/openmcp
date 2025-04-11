// import { createDbSdk } from '@libs/db-pg';
import { truncateSchemaTables } from '@libs/db-pg-migrations';

const dbUrl = process.env['DN_PG_URL']!;

if (!dbUrl.includes('localhost')) {
  throw new Error('Seed may only be run against a database running on localhost.');
}

// const db = createDbSdk({ uri: dbUrl });

async function seed() {
  await truncateSchemaTables({ dbUrl: process.env['DN_PG_URL']! });
}

try {
  await seed();

  console.log('Seeding completed.');

  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
