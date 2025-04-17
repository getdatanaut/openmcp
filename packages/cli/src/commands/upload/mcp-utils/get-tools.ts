import type { client } from '../../../libs/client.ts';
import type { ConnectedClient } from './create-client.ts';

type Tool = NonNullable<Parameters<typeof client.mcpServers.upload>[0]['tools']>[number];

function unwrapBooleanOrUndefined(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

export default async function getTools(client: ConnectedClient): Promise<Tool[]> {
  const capabilities = client.getServerCapabilities();
  if (!capabilities?.tools) {
    console.warn(`No "tools" capability found`);
    return [];
  }

  try {
    return (await client.listTools()).tools.map<Tool>(tool => {
      const annotations = tool['annotations'] as Record<string, unknown> | undefined;
      const title = annotations?.['title'];
      return {
        name: tool.name,
        displayName: typeof title === 'string' ? title : undefined,
        description: tool.description,
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
