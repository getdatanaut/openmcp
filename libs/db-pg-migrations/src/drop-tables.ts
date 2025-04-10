import { initClient } from '@libs/db-pg-client';
import { sql } from 'kysely';

interface MigrateOpts {
  dbUrl: string;

  // defaults to public
  schema?: string;
}

export async function dropSchemaTables({ dbUrl, schema }: MigrateOpts) {
  const { db } = initClient({
    uri: dbUrl,
  });

  const s = schema || 'public';

  const res = await sql<{ dropStatement: string }>`
    SELECT 'DROP TABLE IF EXISTS "' || schemaname || '"."' || tablename || '" CASCADE;' AS drop_statement
    FROM pg_tables
    WHERE schemaname = ${s};`.execute(db);

  const dropStatements = res.rows.map(r => r.dropStatement).join('\n');

  await sql`${sql.raw(dropStatements)}`.execute(db);

  await sql`${sql.raw('DROP SCHEMA IF EXISTS drizzle CASCADE')}`.execute(db);
}
