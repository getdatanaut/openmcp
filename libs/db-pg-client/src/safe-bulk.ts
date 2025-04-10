import * as R from 'remeda';

/**
 * Wrap bulk lookups, inserts, upserts, etc when you may have a large number of values/parameters (like, many thousands)
 * to avoid hitting the PG max parameter limit.
 */
export const safeBulkOp = async <V, R>(values: V[], fn: (values: V[]) => Promise<R[]>) => {
  if (!values.length) return [] as R[];

  // Max parameters in postgres is 65534 - make sure to stay well under this
  // each upsert includes x parameters (num keys in each upsert), so we need to chunk the upserts
  const keyLength = Object.keys(values[0]!).length;

  // Picking an upper bound of 40k to be safe
  const chunks = R.chunk(values, Math.round(40000 / keyLength));

  const results = await Promise.all(chunks.map(c => fn(c)));

  return R.flat(results);
};
