import { createDbSdk } from '@libs/db-pg';
import { truncateSchemaTables } from '@libs/db-pg-migrations';

const dbUrl = process.env['DN_PG_URL']!;

if (!dbUrl.includes('localhost')) {
  throw new Error('Seed may only be run against a database running on localhost.');
}

await using db = createDbSdk({ uri: dbUrl });

async function seed() {
  await truncateSchemaTables({ dbUrl: process.env['DN_PG_URL']! });
  await db.queries.oauthApplication.createOAuthApplication({
    name: '@openmcp/cli',
    clientId: 'openmcp-cli',
    redirectURLs: [3000, 3001, 3002, 4555, 4556, 4557, 8000, 8001, 8002].map(port => `http://localhost:${port}/`),
  });
}

try {
  await seed();

  console.log('Seeding completed.');

  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
