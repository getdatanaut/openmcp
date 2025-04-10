import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { type Config, createRemixServer } from '@openmcp/remix';

type Input = {
  readonly server: string;
  readonly secret?: string;
};

export default async function handler(_input: Input): Promise<void> {}

export async function startRemixServer(definition: Config) {
  const remixServer = await createRemixServer(definition);
  const transport = new StdioServerTransport();
  await remixServer.connect(transport);
  return remixServer;
}
