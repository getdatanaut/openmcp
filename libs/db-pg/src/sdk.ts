import { initClient, type InitClientOpts, type PgClientMetrics } from '@libs/db-pg-client';
import type { Kysely, Transaction } from 'kysely';

import type { DbSchema } from './db.ts';
import { AUTH_VERIFICATIONS_KEY, authVerificationQueries } from './tables/auth-verifications/index.ts';
import { USER_ACCOUNTS_KEY, userAccountQueries } from './tables/user-accounts/index.ts';
import { USER_SESSIONS_KEY, userSessionQueries } from './tables/user-sessions/index.ts';
import { userQueries, USERS_KEY } from './tables/users/index.ts';

type InitDbSdkOpts = InitClientOpts;

export type DbSdk = ReturnType<typeof createDbSdk>;

export const createDbSdk = (opts: InitDbSdkOpts) => {
  const { db, metrics } = initClient<DbSchema>(opts);

  return initSdk({ db, metrics });
};

const initSdk = ({ db, metrics }: { db: Kysely<DbSchema>; metrics: PgClientMetrics }) => {
  // Please keep in alphabetical order.
  const queries = {
    [AUTH_VERIFICATIONS_KEY]: authVerificationQueries({ db }),
    [USER_ACCOUNTS_KEY]: userAccountQueries({ db }),
    [USER_SESSIONS_KEY]: userSessionQueries({ db }),
    [USERS_KEY]: userQueries({ db }),
  };

  return {
    client: db,
    metrics,
    queries,
    transaction: <T>(callback: (props: { trx: Transaction<DbSchema>; trxQueries: typeof queries }) => Promise<T>) => {
      return db.transaction().execute(trx => {
        return callback({ trx, trxQueries: initSdk({ db: trx, metrics }).queries });
      });
    },
  };
};
