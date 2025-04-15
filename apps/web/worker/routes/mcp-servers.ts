import { asSchema } from '@ai-sdk/ui-utils';
import {
  McpClientConfigSchemaSchema,
  ToolInputSchemaSchema,
  ToolOutputSchemaSchema,
  TransportSchema,
} from '@libs/db-pg';
import { openApiToMcpServerOptions } from '@openmcp/openapi';
import { call } from '@orpc/server';
import { z } from 'zod';

import { base, requireAuth } from '../middleware.ts';

const listMcpServers = base.handler(async ({ context: { db } }) => {
  return db.queries.mcpServers.list();
});

const uploadMcpServer = base
  .use(requireAuth)
  .route({ method: 'PUT', path: '/mcp-servers/{externalId}' })
  .input(
    z.object({
      name: z.string(),
      externalId: z.string().min(2).max(255),
      description: z.string().optional(),
      instructions: z.string().optional(),
      iconUrl: z.string().url().optional(),
      developer: z.string().optional(),
      developerUrl: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
      configSchema: McpClientConfigSchemaSchema.optional(),
      transport: TransportSchema,
      tools: z
        .array(
          z.object({
            name: z.string(),
            displayName: z.string().optional(),
            description: z.string().optional(),
            instructions: z.string().optional(),
            inputSchema: ToolInputSchemaSchema.optional(),
            outputSchema: ToolOutputSchemaSchema.optional(),
            isReadonly: z.boolean().optional(),
            isDestructive: z.boolean().optional(),
            isIdempotent: z.boolean().optional(),
            isOpenWorld: z.boolean().optional(),
          }),
        )
        .default([]),
    }),
  )
  .handler(async ({ context: { db, session }, input }) => {
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

const uploadFromOpenApi = base
  .use(requireAuth)
  .input(
    z.object({
      openapi: z.string().url(),
      serverUrl: z.string().url().optional(),
      iconUrl: z.string().url().optional(),
      developer: z.string().optional(),
      developerUrl: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
    }),
  )
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
        name: service.name,
        externalId: serverUrl,
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
