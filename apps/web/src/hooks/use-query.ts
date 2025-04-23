import type { Query, Zero } from '@rocicorp/zero';
import { type QueryResult, useQuery as useZeroQuery, type UseQueryOptions } from '@rocicorp/zero/react';

import type { Schema } from '~shared/zero-schema.ts';

import { useZero } from './use-zero.ts';

export function useQuery<TReturn>(
  createQuery: (z: Zero<Schema>) => Query<Schema, any, TReturn>,
  options?: UseQueryOptions | boolean,
): QueryResult<TReturn> {
  const z = useZero();
  const query = createQuery(z);
  return useZeroQuery(query, options);
}
