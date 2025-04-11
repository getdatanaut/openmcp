import * as fs from 'node:fs/promises';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { type Config, createRemixServer, parseConfig } from '@openmcp/remix';

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
    return parseConfig(JSON.parse(await fs.readFile(input.configFile, 'utf8')));
  }

  throw new Error('Server config not supported');
}

export default async function handler(input: Input): Promise<void> {
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
