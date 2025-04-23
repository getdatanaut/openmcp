import * as fs from 'node:fs/promises';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Config } from '@openmcp/remix';

import { rpcClient } from '../../libs/client.ts';

type Input =
  | {
      readonly server: string;
      readonly secret?: string;
    }
  | {
      readonly configFile: string;
    };

async function loadConfig(input: Input): Promise<Config> {
  if ('configFile' in input) {
    const { parseConfig } = await import('@openmcp/remix');
    return parseConfig(JSON.parse(await fs.readFile(input.configFile, 'utf8')));
  }

  const list = await rpcClient.agents.listAgents({
    name: input.server,
  });

  if (list.length === 0) {
    process.stderr.write(`No server found with name ${input.server}\n`);
  } else if (list.length > 1) {
    process.stderr.write(`Multiple servers found with name ${input.server}\n`);
  }

  return rpcClient.agents.getRemix({ agentId: list[0]!.id });
}

export default async function handler(input: Input): Promise<void> {
  const { createRemixServer } = await import('@openmcp/remix');
  const config = await loadConfig(input);
  const remixServer = await createRemixServer(
    {
      // hardcoded for now
      name: '@openmcp/cli-remix-server',
      version: '0.0.0',
    },
    config,
  );
  const transport = new StdioServerTransport();
  await remixServer.connect(transport);
  process.once('beforeExit', async () => {
    await remixServer.close();
  });
}
