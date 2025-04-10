import type { CamelCasedProperties } from '@libs/utils-types';
import type { Table } from 'drizzle-orm';
import type { Kyselify } from 'drizzle-orm/kysely';
import type { Kysely } from 'kysely';

import type { DbSchema } from './db.ts';

export type DrizzleToKysely<T extends Table> = CamelCasedProperties<Kyselify<T>>;

export interface BuildQueriesOpts {
  db: Kysely<DbSchema>;
}
