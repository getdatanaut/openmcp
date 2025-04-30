import consola from '../../consola/index.ts';
import { rpcClient } from '../../libs/datanaut/sdk/sdk.ts';
import createConnectedClient from './mcp-utils/create-client.ts';
import listMcpTools from './mcp-utils/get-tools.ts';
import createTransportDefinition from './transport-definitions/index.ts';
import type { ServerDefinition } from './types.ts';

export default async function handler(definition: ServerDefinition): Promise<void> {
  const { transport, transportConfig, configSchema, externalId, metadata } =
    await createTransportDefinition(definition);
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
    name: serverAnnotations?.serverName ?? metadata?.name ?? serverVersion.name,
    externalId: externalId ?? serverVersion.name,
    description: metadata?.description,
    developer: definition.developer ?? metadata?.developer,
    developerUrl: definition.developerUrl || metadata?.developerUrl,
    iconUrl: definition.iconUrl ?? serverAnnotations?.iconUrl ?? metadata?.iconUrl,
    sourceUrl: definition.sourceUrl,
    configSchema,
    transport: transportConfig,
    tools: await listMcpTools(client),
  };

  consola.start(`Uploading server "${mcpServer.name}"...`);
  await rpcClient.cli.mcpServers.upload(mcpServer);
  consola.success(`Server "${mcpServer.name}" successfully uploaded`);
}
