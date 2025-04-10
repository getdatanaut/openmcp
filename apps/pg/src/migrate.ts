import { migrateToLatest } from '@libs/db-pg-migrations';

await migrateToLatest({ dbUrl: process.env['DN_PG_URL']!, migrationsFolder: 'migrations' });

process.exit();
