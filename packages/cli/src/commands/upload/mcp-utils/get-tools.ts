import consola from '../../../consola/index.ts';
import type { rpcClient } from '../../../libs/sdk.ts';
import { getSummary } from '../utils/string.ts';
import type { ConnectedClient } from './create-client.ts';

type Tool = NonNullable<Parameters<typeof rpcClient.mcpServers.upload>[0]['tools']>[number];

function unwrapBooleanOrUndefined(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

export default async function getTools(client: ConnectedClient): Promise<Tool[]> {
  const capabilities = client.getServerCapabilities();
  if (!capabilities?.tools) {
    consola.warn(`No "tools" capability found`);
    return [];
  }

  try {
    return (await client.listTools()).tools.map<Tool>(tool => {
      const annotations = tool['annotations'] as Record<string, unknown> | undefined;
      const title = annotations?.['title'];
      return {
        name: tool.name,
        description: tool.description,
        summary: tool.description ? getSummary(tool.description) : undefined,
        displayName: typeof title === 'string' ? title : undefined,
        inputSchema: tool.inputSchema,
        outputSchema: tool['outputSchema'] as Tool['outputSchema'] | undefined,
        isReadonly: unwrapBooleanOrUndefined(annotations?.['readOnlyHint']),
        isDestructive: unwrapBooleanOrUndefined(annotations?.['destructiveHint']),
        isIdempotent: unwrapBooleanOrUndefined(annotations?.['idempotentHint']),
        isOpenWorld: unwrapBooleanOrUndefined(annotations?.['openWorldHint']),
      };
    });
  } catch (error) {
    throw new Error(`Failed to list tools: ${error}`);
  }
}
