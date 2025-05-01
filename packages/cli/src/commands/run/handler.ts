import * as fs from 'node:fs/promises';
import process from 'node:process';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Config } from '@openmcp/remix';
import { onExit } from 'signal-exit';

import console, { pipeToLogFile } from '#libs/console';

import { rpcClient } from '../../libs/datanaut/sdk/sdk.ts';

type Input =
  | {
      readonly server: string;
      readonly secret?: string;
    }
  | {
      readonly configFile: string;
    };

async function loadRemix(input: Input): Promise<Config> {
  if ('configFile' in input) {
    const { loadConfig } = await import('@openmcp/remix');
    return loadConfig(JSON.parse(await fs.readFile(input.configFile, 'utf8')), process.env);
  }

  const list = await rpcClient.cli.agents.listAgents({
    name: input.server,
  });

  if (list.length === 0) {
    throw new Error(`No server found with name ${input.server}\n`);
  } else if (list.length > 1) {
    throw new Error(`Multiple servers found with name ${input.server}\n`);
  }

  return rpcClient.cli.agents.getRemix({ agentId: list[0]!.id });
}

export default async function handler(input: Input): Promise<void> {
  using _ = await pipeToLogFile();
  const { createRemixServer } = await import('@openmcp/remix');
  let remixServer;
  try {
    console.log('Loading remix...');
    const remix = await loadRemix(input);
    console.log('Successfully loaded remix');
    console.log('Starting server...');
    remixServer = await createRemixServer(
      {
        // hardcoded for now
        name: '@openmcp/cli-remix-server',
        version: '0.0.0',
      },
      remix,
    );
    console.log('Successfully started server');
    const transport = new StdioServerTransport();
    await remixServer.connect(transport);
    console.log('Established connection to server');
  } catch (error) {
    if (error instanceof Error) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write(`Unknown error: ${error}\n`);
    }

    process.exit(1);
  }

  await new Promise(resolve => {
    onExit(() => {
      console.log('Shutting down...');
      remixServer.close().finally(resolve);
    });
  });
}
