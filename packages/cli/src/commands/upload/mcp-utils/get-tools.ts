import console from '#libs/console';

import type { rpcClient } from '../../../libs/datanaut/sdk/sdk.ts';
import { getSummary } from '../utils/string.ts';
import type { ConnectedClient } from './create-client.ts';

type Tool = NonNullable<Parameters<typeof rpcClient.cli.mcpServers.upload>[0]['tools']>[number];

export default async function getTools(client: ConnectedClient): Promise<Tool[]> {
  const capabilities = client.getServerCapabilities();
  if (!capabilities?.tools) {
    console.warn(`No "tools" capability found`);
    return [];
  }

  try {
    return (await client.listTools()).tools.map<Tool>(tool => {
      const annotations = tool.annotations;
      return {
        name: tool.name,
        description: tool.description,
        summary: tool.description ? getSummary(tool.description) : undefined,
        displayName: annotations?.title,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        isReadonly: annotations?.readOnlyHint,
        isDestructive: annotations?.destructiveHint,
        isIdempotent: annotations?.idempotentHint,
        isOpenWorld: annotations?.openWorldHint,
      };
    });
  } catch (error) {
    throw new Error(`Failed to list tools: ${error}`);
  }
}
