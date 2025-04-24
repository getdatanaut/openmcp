import type { CustomMutatorDefs } from '@rocicorp/zero';

import { type AuthData } from '~shared/auth.ts';
import { createMutators } from '~shared/zero-mutators.ts';
import type { schema } from '~shared/zero-schema.ts';

export type PostCommitTask = () => Promise<void>;

export function createServerMutators(
  authData: AuthData | undefined,
  serverOpts: { dbEncSecret: string; postCommitTasks: PostCommitTask[] },
) {
  const mutators = createMutators(authData, serverOpts);

  return {
    ...mutators,
  } as const satisfies CustomMutatorDefs<typeof schema>;
}
