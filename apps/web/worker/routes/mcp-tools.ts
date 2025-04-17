import { base } from '../middleware.ts';

const listMcpTools = base.mcpTools.list.handler(async ({ context: { db }, input, errors }) => {
  // @TODO: permission check
  const server = await db.queries.mcpServers.getById({ id: input.serverId });
  if (!server) {
    throw errors.NOT_FOUND();
  }

  return db.queries.mcpTools.listByServerId({ serverId: input.serverId });
});

export const mpcToolsRouter = {
  mcpTools: {
    list: listMcpTools,
  },
};
