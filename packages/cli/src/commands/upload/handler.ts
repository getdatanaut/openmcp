import * as fs from 'node:fs/promises';

import { rpc } from '../../libs/rpc.ts';

async function loadConfig(input: Input): Promise<Config> {
  if ('configFile' in input) {
    return parseConfig(JSON.parse(await fs.readFile(input.configFile, 'utf8')));
  }

  throw new Error('Server config not supported');
}

export default async function handler(input: Input): Promise<void> {
  const uploadFromOpenApi = useMutation(rpc.mcpServers.uploadFromOpenApi.mutationOptions());
}
