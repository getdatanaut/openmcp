# @libs/db-pg

Drizzle for schema definition and migrations, kysely for queries.

When adding a new table:

1. Create a `src/tables/{table}` folder with index, schema, and queries files.
2. Add it to `src/db.ts` (kysely db typing)
3. Add it to `src/sdk.ts` (runtime queries sdk)
4. Add it to `src/schema.ts` (migrations)

See migration instructions in `apps/pg/README.md`.
