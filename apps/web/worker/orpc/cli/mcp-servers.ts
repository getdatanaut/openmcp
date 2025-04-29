import { upsertMcpServer } from '../mcp-servers.ts';
import { base, requireAuth } from '../middleware.ts';

const uploadMcpServer = base.mcpServers.upload
  .use(requireAuth)
  .handler(async ({ context: { db, user, organizationId }, input }) => {
    const { tools, transport, configSchema, visibility, ...serverProps } = input;

    const server = await upsertMcpServer({
      db,
      userId: user.id,
      organizationId,
      externalId: input.externalId,
      visibility,
      server: {
        ...serverProps,
        transportJson: transport,
        configSchemaJson: configSchema,
      },
      tools: tools.map(({ inputSchema, outputSchema, ...rest }) => ({
        ...rest,
        organizationId,
        createdBy: user.id,
        inputSchemaJson: inputSchema,
        outputSchemaJson: outputSchema,
      })),
    });

    return {
      id: server.id,
    };
  });

export const mcpServersRouter = {
  mcpServers: {
    upload: uploadMcpServer,
  },
};
