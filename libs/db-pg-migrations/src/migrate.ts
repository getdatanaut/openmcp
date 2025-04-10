import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

interface MigrateOpts {
  dbUrl: string;
  migrationsFolder?: string;
}

export async function migrateToLatest({ dbUrl, migrationsFolder = 'migrations' }: MigrateOpts) {
  let error;
  try {
    const migrationClient = postgres(dbUrl, { max: 1 });

    const db = drizzle(migrationClient);
    await migrate(db, { migrationsFolder });

    if (migrationClient) {
      await migrationClient.end();
    }
  } catch (err) {
    error = err;
  }

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }
}
