import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';

import { MyCamelCasePlugin } from './camel-case.ts';
import type { InitClientFn, InitClientOpts, InitClientOptsWithSql, PgClient } from './types.ts';

let client: PgClient<any>;

const KIND_METRIC_MAPPING = {
  SelectQueryNode: 'select',
  InsertQueryNode: 'insert',
  UpdateQueryNode: 'udpate',
  DeleteQueryNode: 'select',
};

export const initClient: InitClientFn = <DB>(opts: InitClientOpts): PgClient<DB> => {
  const { debug, reuse, skipCamelCase } = opts;
  if (client && reuse) {
    return client as PgClient<DB>;
  }

  const metrics = {
    query: 0,
    error: 0,
    kind: {
      select: 0,
      insert: 0,
      update: 0,
      delete: 0,
      other: 0,
    },
    reset() {
      this.query = 0;
      this.error = 0;
      this.kind.select = 0;
      this.kind.insert = 0;
      this.kind.update = 0;
      this.kind.delete = 0;
      this.kind.other = 0;
    },
  };

  const sql = isInitClientOptsWithSql(opts) ? opts.sql : postgres(opts.uri, { max: opts.max });

  const db = new Kysely<DB>({
    plugins: [
      new MyCamelCasePlugin({
        excludeColumns: skipCamelCase,
        underscoreBetweenUppercaseLetters: true,
      }),
    ],
    log: evt => {
      metrics[evt.level] += 1;
      metrics.kind[KIND_METRIC_MAPPING[evt.query.query.kind] || 'other'] += 1;

      if (debug) {
        console.log(evt.query.sql);
        console.log(`duration: ${evt.queryDurationMillis}ms`);
      }

      if (evt.level === 'error') {
        console.error(evt.query.sql);
      }
    },
    dialect: new PostgresJSDialect({
      postgres: sql,
    }),
  });

  client = { db, sql, metrics };

  return client as PgClient<DB>;
};

const isInitClientOptsWithSql = (opts: InitClientOpts): opts is InitClientOptsWithSql => {
  return (opts as InitClientOptsWithSql).sql !== undefined;
};
