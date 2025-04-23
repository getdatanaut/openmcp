import type { Config as RemixDefinition } from '@openmcp/remix';
import assert from 'assert/strict';

import { base, requireAuth } from './middleware.ts';

// @todo: read access permissions check
const listAgents = base.agents.listAgents.use(requireAuth).handler(({ context: { db, organizationId }, input }) => {
  return db.queries.agents.list({
    organizationId,
    name: input.name,
  });
});

// @todo: read access permissions check
const getRemix = base.agents.getRemix.use(requireAuth).handler(async ({ context: { db, publicUrl }, input }) => {
  const list = await db.queries.agents.orderedListWithDependencies({ agentId: input.agentId });

  const server: RemixDefinition = {
    configs: {},
    servers: {},
  };

  for (let i = 0; i < list.length; i++) {
    const { transport, config, toolName, serverName, serverId } = list[i]!;
    if (Object.hasOwn(server.configs, serverName)) {
      throw new Error(`Duplicate server name: ${serverName} with different configs`);
    }
    server.configs[serverName] = config;

    let actualTransport = transport;
    if (actualTransport.type === 'openapi') {
      actualTransport = structuredClone(actualTransport);
      const route = `/api/mcp-servers/${serverId}/openapi`;
      const url = new URL(publicUrl);
      url.pathname = url.pathname === '/' ? route : `${url.pathname}${route}`;
      actualTransport.serverConfig.openapi = url.toString();
    }

    const serverDefinition = (server.servers[serverName] = {
      ...actualTransport,
      tools: [
        {
          name: toolName,
        },
      ],
    });

    const tools = serverDefinition.tools;

    for (; i < list.length - 1; i++) {
      const nextElem = list[i + 1]!;
      if (nextElem.serverName !== serverName) break;
      tools.push({ name: nextElem.toolName });
    }
  }

  return server;
});

export const agentsRouter = {
  agents: {
    listAgents,
    getRemix,
  },
};
