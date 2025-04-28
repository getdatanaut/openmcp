import type { TOrganizationId, TUserId } from '@libs/db-ids';
import { Zero } from '@rocicorp/zero';
import { atom, injectAtomInstance, injectAtomValue, injectEffect, injectSignal } from '@zedux/react';

import { CACHE_FOREVER } from '~shared/consts.ts';
import { createMutators } from '~shared/zero-mutators.ts';
import { schema } from '~shared/zero-schema.ts';

import { authAtom } from './auth.ts';

function createZero({
  jwt,
  userId,
  orgId,
  refreshToken,
}: {
  jwt?: string | null;
  userId?: TUserId;
  orgId?: TOrganizationId | null;
  refreshToken: () => Promise<string | undefined>;
}) {
  return new Zero({
    userID: userId ?? 'anon',
    server: import.meta.env.VITE_PUBLIC_ZERO_SERVER,
    schema,
    mutators: createMutators(userId ? { sub: userId, orgId } : undefined, undefined),
    kvStore: import.meta.env.DEV ? 'mem' : 'idb',
    auth: (error?: 'invalid-token') => {
      if (error === 'invalid-token') {
        console.info('Refreshing JWT');
        return refreshToken();
      }

      return jwt ?? undefined;
    },
    onUpdateNeeded(reason) {
      // @TODO
    },
    onError: error => {
      // @TODO could do something w global errors
      console.warn('ZERO ERROR', error);
    },
  });
}

export const zeroAtom = atom('zero', () => {
  const auth = injectAtomInstance(authAtom);

  /**
   * Intentionally only re-evaluate this atom if userId changes not if jwt changes.
   * zero will get a new jwt in the auth() function, and we do not need
   * to tear down the entire zero instance when the jwt is refreshed
   */
  const userId = injectAtomValue(auth.exports.userId);
  const orgId = injectAtomValue(auth.exports.orgId);
  const { jwt } = auth.getOnce();

  const signal = injectSignal(null as unknown as ReturnType<typeof createZero>);

  injectEffect(
    () => {
      const z = createZero({ jwt, userId, orgId, refreshToken: auth.exports.refreshToken });

      signal.set(z);

      return () => z.close();
    },
    [jwt, userId],
    { synchronous: true },
  );

  injectEffect(
    () => {
      const z = signal.get();

      const cleanup: (() => void)[] = [];

      /**
       * Preloads the logged in user's agents, along with the installed tools and some of the uninstalled tools
       * for each one
       */
      if (jwt) {
        cleanup.push(
          z.query.agents
            .related('agentMcpServers', agentMcpServers =>
              agentMcpServers
                .related('agentMcpTools', agentMcpTools => agentMcpTools.related('mcpTool').one())
                .related('mcpServer', mcpServer =>
                  mcpServer.related('mcpTools', mcpTools =>
                    mcpTools.orderBy('displayName', 'asc').orderBy('name', 'asc').limit(20),
                  ),
                ),
            )
            .limit(20)
            .preload(CACHE_FOREVER).cleanup,
        );
      }

      /**
       * Preloads the first 30 MCP servers for our default sort order, along with their first 20 tools
       */
      cleanup.push(
        z.query.mcpServers
          .orderBy('name', 'asc')
          .related('mcpTools', mcpTools => mcpTools.orderBy('displayName', 'asc').orderBy('name', 'asc').limit(20))
          .limit(30)
          .preload(CACHE_FOREVER).cleanup,
      );

      return () => cleanup.forEach(fn => fn());
    },
    [jwt],
    { synchronous: true },
  );

  return signal;
});
