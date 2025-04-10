import type { Kysely } from 'kysely';
import type { Sql } from 'postgres';

interface BaseInitClientOpts {
  debug?: boolean;

  /**
   * Re-use existing client, if one was created previously.
   * Only applicable in the edge client, and usually you will not want this.
   */
  reuse?: boolean;
}

export interface InitClientOptsWithUri extends BaseInitClientOpts {
  uri: string;

  /**
   * Max connections, for the clients that support it.
   */
  max?: number;
}

export interface InitClientOptsWithSql extends BaseInitClientOpts {
  sql: Sql;
}

export type InitClientOpts = InitClientOptsWithUri | InitClientOptsWithSql;

export interface PgClientMetrics {
  reset(): void;
  query: number;
  error: number;
  kind: {
    select: number;
    insert: number;
    update: number;
    delete: number;
    other: number;
  };
}

export interface PgClient<T> {
  db: Kysely<T>;
  sql: Sql;
  metrics: PgClientMetrics;
}

export type InitClientFn = <T>(opts: InitClientOpts) => PgClient<T>;
