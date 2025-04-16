import { asSchema } from '@ai-sdk/ui-utils';
import type { ToolInputSchemaSchema, ToolOutputSchemaSchema } from '@libs/schemas/mcp';
import { openApiToMcpServerOptions } from '@openmcp/openapi';
import { call } from '@orpc/server';
import type { z } from 'zod';

import { base, requireAuth } from '../middleware.ts';

const listMcpServers = base.mcpServers.list.handler(async ({ context: { db } }) => {
  return db.queries.mcpServers.listWithTools();
});

const uploadMcpServer = base.mcpServers.upload.use(requireAuth).handler(async ({ context: { db, session }, input }) => {
  const { tools, ...serverProps } = input;

  const existing = await db.queries.mcpServers.getByExternalId({
    userId: session.userId,
    externalId: input.externalId,
  });
  const existingTools = existing ? await db.queries.mcpTools.listByServerId({ serverId: existing.id }) : [];
  const toolsToDelete = existingTools.filter(t => !input.tools.some(t2 => t2.name === t.name));

  const server = await db.transaction(async tx => {
    if (toolsToDelete.length) {
      await tx.trxQueries.mcpTools.bulkDeleteById({ ids: toolsToDelete.map(t => t.id) });
    }

    const server = await tx.trxQueries.mcpServers.upsert({ ...serverProps, userId: session.userId });

    await tx.trxQueries.mcpTools.bulkUpsert(tools.map(t => ({ ...t, mcpServerId: server.id })));

    return server;
  });

  return {
    id: server.id,
  };
});

const uploadFromOpenApi = base.mcpServers.uploadFromOpenApi
  .use(requireAuth)
  .handler(async ({ context, input, errors }) => {
    const { openapi, sourceUrl, iconUrl, developer, developerUrl } = input;

    const { service, options } = await openApiToMcpServerOptions({ openapi, serverUrl: input.serverUrl });

    const serverUrl = input.serverUrl ?? service.servers?.[0]?.url;
    if (!serverUrl) {
      throw errors.BAD_REQUEST({
        message: 'Server URL must be provided, or the the OpenAPI specification must contain a server definition.',
        data: { issues: [] },
      });
    }

    const res = await call(
      uploadMcpServer,
      {
        name: input.name || service.name,
        externalId: serverUrl,
        summary: getFirstSentence(service.description) || undefined,
        description: service.description,
        developer: developer || service.contact?.name,
        developerUrl: developerUrl || service.contact?.url,
        iconUrl: iconUrl || service.logo?.url,
        sourceUrl,
        transport: {
          type: 'openapi',
          serverConfig: {
            openapi,
            serverUrl,
          },
        },
        tools: Object.entries(options.tools).map(([name, tool]) => ({
          name,
          displayName: tool.annotations?.title,
          summary: getFirstSentence(tool.description) || undefined,
          description: tool.description,
          inputSchema: tool.parameters
            ? (asSchema(tool.parameters).jsonSchema as z.infer<typeof ToolInputSchemaSchema>)
            : undefined,
          outputSchema: tool.output
            ? (asSchema(tool.output).jsonSchema as z.infer<typeof ToolOutputSchemaSchema>)
            : undefined,
          isReadonly: tool.annotations?.hints?.readOnly,
          isDestructive: tool.annotations?.hints?.destructive,
          isIdempotent: tool.annotations?.hints?.idempotent,
          isOpenWorld: true,
        })),
      },
      {
        context,
      },
    );

    return res;
  });

export const mpcServersRouter = {
  mcpServers: {
    list: listMcpServers,
    upload: uploadMcpServer,
    uploadFromOpenApi: uploadFromOpenApi,
  },
};

/**
 * Extracts the first sentence from a given text string.
 *
 * A sentence is defined as a sequence of characters ending with '.', '!', or '?'.
 * Note: This simple definition may not correctly handle all edge cases,
 * such as abbreviations containing periods (e.g., "Mr.").
 *
 * @param text The input string, potentially undefined or null.
 * @returns A string containing the first sentence, or the original text
 *          if it contains no sentence terminators.
 *          Returns an empty string if the input is null, undefined, or whitespace only.
 */
function getFirstSentence(text: string | undefined | null): string {
  if (!text) {
    return '';
  }

  // Trim leading/trailing whitespace from the input
  const trimmedText = text.trim();
  if (!trimmedText) {
    return '';
  }

  // Regex to match the first sentence:
  // - Matches one or more characters that are not sentence terminators ([^.!?]+)
  // - Followed by a sentence terminator ([.!?])
  // - Does *not* use the 'g' flag, so it stops after the first match.
  const sentenceRegex = /[^.!?]+[.!?]/;
  const match = trimmedText.match(sentenceRegex);

  // If no sentence with a terminator is found, return the trimmed text
  if (!match) {
    return trimmedText;
  }

  // Return the first matched sentence, trimming any trailing whitespace
  return match[0].trim();
}
