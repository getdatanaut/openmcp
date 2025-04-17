// import { rpcClient } from '../../libs/client.ts';
import createConnectedClient from './mcp-utils/create-client.ts';
import listMcpTools from './mcp-utils/get-tools.ts';
import createTransportDefinition from './transport-definitions/index.ts';
import type { ServerDefinition } from './types.ts';

export default async function handler(definition: ServerDefinition): Promise<void> {
  const { transport, transportConfig, configSchema, externalId } = await createTransportDefinition(definition);
  const defaultAnnotations = {
    iconUrl: definition.iconUrl,
    developer: definition.developer,
  };

  await using client = await createConnectedClient(transport, defaultAnnotations);
  const serverVersion = client.getServerVersion();
  if (!serverVersion) {
    throw new Error('Failed to get server version');
  }
  const serverAnnotations = client.getServerAnnotations();

  const mcpServer = {
    name: serverVersion.name,
    externalId: externalId ?? serverVersion.name,
    description: unwrapStringOrUndefined(serverAnnotations?.['description']),
    developer: definition.developer ?? unwrapStringOrUndefined(serverAnnotations?.['developer']),
    developerUrl: definition.developerUrl || unwrapStringOrUndefined(serverAnnotations?.['developerUrl']),
    iconUrl: definition.iconUrl ?? serverAnnotations?.iconUrl,
    sourceUrl: definition.sourceUrl,
    configSchema,
    transport: transportConfig,
    tools: await listMcpTools(client),
  };

  console.log(mcpServer);
  // await rpcClient.mcpServers.upload(mcpServer);
}

function unwrapStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
