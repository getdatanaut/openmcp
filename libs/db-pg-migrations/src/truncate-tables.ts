import { initClient } from '@libs/db-pg-client';
import { sql } from 'kysely';

interface MigrateOpts {
  dbUrl: string;

  // defaults to public
  schema?: string;
}

export async function truncateSchemaTables({ dbUrl, schema }: MigrateOpts) {
  const { db } = initClient({
    uri: dbUrl,
  });

  const s = schema || 'public';

  const res = await sql<{ truncateStatement: string }>`
    SELECT 'TRUNCATE TABLE "' || tablename || '" CASCADE;' AS truncate_statement
    FROM pg_tables
    WHERE schemaname = ${s};`.execute(db);

  const truncateStatements = res.rows.map(r => r.truncateStatement).join('\n');

  await sql`${sql.raw(truncateStatements)}`.execute(db);
}
