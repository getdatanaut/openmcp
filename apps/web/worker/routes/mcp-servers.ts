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
      externalId: z.string().min(2).max(64),
      description: z.string().optional(),
      instructions: z.string().optional(),
      iconUrl: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
      configSchema: z.object({}).optional(),
      tools: z
        .array(
          z.object({
            name: z.string(),
            displayName: z.string().optional(),
            description: z.string().optional(),
            instructions: z.string().optional(),
            inputSchema: z.object({}).optional(),
            outputSchema: z.object({}).optional(),
            isReadOnly: z.boolean().optional(),
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

export const mpcServersRouter = {
  mcpServers: {
    list: listMcpServers,
    upload: uploadMcpServer,
  },
};
