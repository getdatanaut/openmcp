import { asSchema } from '@ai-sdk/ui-utils';
import { routerContract } from '@libs/api-contract';
import type { TUserId } from '@libs/db-ids';
import type { DbSdk, NewMcpServer, NewMcpTool } from '@libs/db-pg';
import type { ToolInputSchemaSchema, ToolOutputSchemaSchema } from '@libs/schemas/mcp';
import { openApiToMcpServerOptions } from '@openmcp/openapi';
import type { ResultAsync } from 'neverthrow';
import { fromPromise, okAsync } from 'neverthrow';
import type { z } from 'zod';

import { base, requireAuth } from './middleware.ts';

const uploadMcpServer = base.mcpServers.upload.use(requireAuth).handler(async ({ context: { db, user }, input }) => {
  const { tools, transport, configSchema, ...serverProps } = input;

  const server = await upsertMcpServer({
    db,
    userId: user.id,
    externalId: input.externalId,
    server: {
      ...serverProps,
      transportJson: transport,
      configSchemaJson: configSchema,
    },
    tools: tools.map(({ inputSchema, outputSchema, ...rest }) => ({
      ...rest,
      inputSchemaJson: inputSchema,
      outputSchemaJson: outputSchema,
    })),
  });

  return {
    id: server.id,
  };
});

const uploadFromOpenApi = base.mcpServers.uploadFromOpenApi
  .use(requireAuth)
  .handler(async ({ context: { db, user, r2OpenApiBucket }, input, errors }) => {
    const { openapi, sourceUrl, iconUrl, developer, developerUrl } = input;

    const { service, options } = await openApiToMcpServerOptions({ openapi, serverUrl: input.serverUrl });

    const serverUrl = input.serverUrl ?? service.servers?.[0]?.url;
    if (!serverUrl) {
      throw errors.BAD_REQUEST({
        message: 'Server URL must be provided, or the the OpenAPI specification must contain a server definition.',
      });
    }

    const server = await upsertMcpServer({
      db,
      userId: user.id,
      externalId: serverUrl,
      server: {
        name: input.name || service.name,
        externalId: serverUrl,
        summary: getFirstSentence(service.description) || undefined,
        description: service.description,
        developer: developer || service.contact?.name,
        developerUrl: developerUrl || service.contact?.url,
        iconUrl: iconUrl || service.logo?.url,
        sourceUrl,
        transportJson: {
          type: 'openapi',
          serverConfig: {
            openapi: '', // doc will be available at /api/mcp-servers/{serverId}/openapi
            serverUrl,
          },
        },
      },
      tools: Object.entries(options.tools).map(([name, tool]) => ({
        name,
        displayName: tool.annotations?.title,
        summary: getFirstSentence(tool.description) || undefined,
        description: tool.description,
        inputSchemaJson: tool.parameters
          ? (asSchema(tool.parameters).jsonSchema as z.infer<typeof ToolInputSchemaSchema>)
          : undefined,
        outputSchemaJson: tool.output
          ? (asSchema(tool.output).jsonSchema as z.infer<typeof ToolOutputSchemaSchema>)
          : undefined,
        isReadonly: tool.annotations?.hints?.readOnly,
        isDestructive: tool.annotations?.hints?.destructive,
        isIdempotent: tool.annotations?.hints?.idempotent,
        isOpenWorld: true,
      })),
    });

    const storeResult = await storeDocument({
      urlOrContents: openapi,
      put: async contents => {
        const object = await r2OpenApiBucket.put(server.id, contents);
        if (!object) {
          throw new Error('Failed');
        }

        return { key: object.key };
      },
    });

    if (storeResult.isErr()) {
      console.error(storeResult.error);
      throw errors.BAD_REQUEST({
        message: storeResult.error.toString(),
        cause: storeResult.error,
      });
    }

    const route = routerContract.mcpServers.getOpenApiDocument['~orpc'].route;
    console.log(`OpenAPI document available at ${route.method} ${route.path}`);

    return {
      id: server.id,
    };
  });

const getOpenApiDocument = base.mcpServers.getOpenApiDocument.handler(
  async ({ context: { r2OpenApiBucket }, input, errors }) => {
    const object = await r2OpenApiBucket.get(input.serverId);

    if (!object) {
      throw errors.NOT_FOUND({ message: 'OpenAPI document not found' });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    const blob = await object.blob();
    const headersObject = Object.fromEntries(headers);

    return {
      headers: headersObject,
      body: blob,
    };
  },
);

export const mpcServersRouter = {
  mcpServers: {
    upload: uploadMcpServer,
    uploadFromOpenApi: uploadFromOpenApi,
    getOpenApiDocument: getOpenApiDocument,
  },
};

async function upsertMcpServer({
  db,
  userId,
  externalId,
  server,
  tools,
}: {
  db: DbSdk;
  userId: TUserId;
  externalId: string;
  server: Omit<NewMcpServer, 'userId'>;
  tools: Omit<NewMcpTool, 'mcpServerId'>[];
}) {
  const existing = await db.queries.mcpServers.getByExternalId({
    userId,
    externalId,
  });
  const existingTools = existing ? await db.queries.mcpTools.listByServerId({ serverId: existing.id }) : [];
  const toolsToDelete = existingTools.filter(t => !tools.some(t2 => t2.name === t.name));

  return db.transaction(async tx => {
    if (toolsToDelete.length) {
      await tx.trxQueries.mcpTools.bulkDeleteById({ ids: toolsToDelete.map(t => t.id) });
    }

    const dbServer = await tx.trxQueries.mcpServers.upsert({ ...server, userId, toolCount: tools.length });

    await tx.trxQueries.mcpTools.bulkUpsert(tools.map(t => ({ ...t, mcpServerId: dbServer.id })));

    return dbServer;
  });
}

export type FetchDocumentError = ReturnType<typeof fetchDocumentError>;
export const fetchDocumentError = ({ url, error }: { url: string; error: unknown }) => ({
  type: 'FetchDocumentError' as const,
  url,
  error,
  toString() {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Failed to fetch document from ${this.url}: ${errorMessage}`;
  },
});

export type PutDocumentError = ReturnType<typeof putDocumentError>;
export const putDocumentError = ({ error }: { error: unknown }) => ({
  type: 'PutDocumentError' as const,
  error,
  toString() {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Failed to save document: ${errorMessage}`;
  },
});

function storeDocument({
  urlOrContents,
  put,
}: {
  urlOrContents: string;
  put: (contents: string) => Promise<{ key: string }>;
}): ResultAsync<{ key: string }, FetchDocumentError | PutDocumentError> {
  let getContentResult: ResultAsync<string, FetchDocumentError>;

  try {
    // Check if it looks like a URL using URL constructor for better validation
    const url = new URL(urlOrContents);
    if (['http:', 'https:'].includes(url.protocol)) {
      // It's a valid HTTP/HTTPS URL, fetch it
      getContentResult = fromPromise(
        fetch(urlOrContents).then(response => {
          if (!response.ok) {
            // Throw an error to be caught by fromPromise's errorHandler
            throw new Error(
              `Failed to fetch document from ${urlOrContents}: ${response.status} ${response.statusText}`,
            );
          }

          return response.text(); // Return the promise for the text body
        }),
        e => fetchDocumentError({ url: urlOrContents, error: e }),
      );
    } else {
      // It's a URL but not HTTP/HTTPS, treat as error or content based on requirements
      // For now, let's assume it should be treated as content if not HTTP/HTTPS
      getContentResult = okAsync(urlOrContents);
    }
  } catch {
    // If URL constructor throws (invalid URL) or fetch setup fails synchronously,
    // assume it's the content itself.
    getContentResult = okAsync(urlOrContents);
  }

  // Chain the result of getting content with the put operation
  return getContentResult.andThen(content =>
    fromPromise(
      put(content), // This now returns Promise<{ key: string }>
      e => putDocumentError({ error: e }),
    ),
  );
}

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
