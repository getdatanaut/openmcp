# pg

Handles db migrations and seeding for postgres.

For local development, copy `.env.example` to `.env`.

## Important Commands

See the `package.json` file for details.

- `yarn workspace pg migrate.up`: Migrates the db to the latest, based on the migration files.
- `yarn workspace pg migrate.generate`: Generate a new migration file, based on changes made to the schema(s).

Dev commands:

- `yarn workspace pg dev.push`: Sync's schema changes with the db, without creating a migration first (for local dev
  workflow).
- `yarn workspace pg dev.seed`: Seeds the DB with test data (all previous data will be lost). Only works for local
  databases.
- `yarn workspace pg dev.reset`: Wipe and re-create the local DB at the latest migration (all data will be lost). Only
  works for local databases.
