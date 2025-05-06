import * as fs from 'node:fs/promises';
import process from 'node:process';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { onExit } from 'signal-exit';

import console, { pipeToLogFile } from '#libs/console';
import type { Config } from '#libs/remix';

import { PrintableError } from '../../errors/index.ts';
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
    const { loadConfig } = await import('#libs/remix');
    return loadConfig(
      {
        cwd: process.cwd(),
        io: {
          fetch,
          fs,
        },
        env: process.env,
      },
      input.configFile,
    );
  }

  return rpcClient.cli.agents.getRemix({ agentId: input.server });
}

async function handler(input: Input): Promise<void> {
  const { createRemixServer } = await import('#libs/remix');
  let remix;
  try {
    console.log('Loading openmcp definition...');
    remix = await loadRemix(input);
    console.log('Successfully loaded openmcp definition');
  } catch (error) {
    throw new PrintableError('Failed to load openmcp definition', error);
  }

  let remixServer;
  try {
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
  } catch (error) {
    throw new PrintableError('Failed to start server', { cause: error });
  }

  try {
    const transport = new StdioServerTransport();
    await remixServer.connect(transport);
    console.log('Established connection to server');
  } catch (error) {
    remixServer.close();
    throw new PrintableError('Failed to connect to server', { cause: error });
  }

  await new Promise(resolve => {
    onExit(() => {
      console.log('Shutting down...');
      remixServer.close().finally(resolve);
    });
  });
}

export default async function (input: Input): Promise<void> {
  using _ = await pipeToLogFile();
  try {
    await handler(input);
  } catch (error) {
    // we write to stderr so that the mcp client can show the error to the client
    process.stderr.write(`${String(error)}\n`);
    // and to the log as well in case the error is not displayed by the client
    console.error(String(error));
    process.exitCode = 1;
  }
}
