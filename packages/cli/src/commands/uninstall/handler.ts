import * as fs from 'node:fs/promises';

import { loadDocument } from '@openmcp/utils/documents';

import console from '#libs/console';
import { type IntegrationName, uninstall } from '#libs/mcp-clients';

import { getAgentById } from '../../libs/datanaut/agent.ts';
import { inferTargetType } from '../../libs/mcp-utils/index.ts';

type Flags = {
  client: IntegrationName;
  type: 'agent-id' | 'openapi' | undefined;
  scope: 'global' | 'local' | 'prefer-local';
};

export default async function handler(target: string, { type, client, scope }: Flags) {
  const server = await getServer(target, type ?? (await inferTargetType(target)));
  const ctx = {
    cwd: process.cwd(),
    logger: console,
  } as const;
  await uninstall(ctx, client, server, scope);
}

async function getServer(target: string, type: NonNullable<Flags['type']>) {
  switch (type) {
    case 'agent-id': {
      const agent = await getAgentById(target);
      return {
        id: agent.id,
        name: agent.name,
        target: agent.id,
      } as const;
    }
    case 'openapi': {
      const name = (
        await loadDocument(
          {
            fs,
            fetch,
          },
          target,
        )
      )['info']?.['title'];
      return {
        id: target,
        name: String(name ?? target),
        target: target,
      };
    }
  }
}
