import { base, requireAuth } from '../middleware.ts';

// @TODO permissions
const listAgentMcpServers = base.agentMcpServers.listWithTools
  .use(requireAuth)
  .handler(async ({ context: { db }, input: { agentId }, errors }) => {
    const agent = await db.queries.agents.getById({ id: agentId });
    if (!agent) {
      throw errors.NOT_FOUND();
    }

    return db.queries.agentsMcpServers.listWithTools({ agentId });
  });

// @TODO permissions
const addTool = base.agentMcpServers.addTool
  .use(requireAuth)
  .handler(async ({ context: { db, session }, input: { agentId, toolId }, errors }) => {
    const agent = await db.queries.agents.getById({ id: agentId });
    if (!agent) {
      throw errors.NOT_FOUND();
    }

    const tool = await db.queries.mcpTools.getById({ id: toolId });
    if (!tool) {
      throw errors.NOT_FOUND();
    }

    await db.queries.agentsMcpServers.upsert({ agentId, mcpServerId: tool.mcpServerId, userId: session.userId });

    return db.queries.agentMcpTools.create({ agentId, mcpServerId: tool.mcpServerId, mcpToolId: tool.id });
  });

// @TODO permissions
const removeTool = base.agentMcpServers.removeTool
  .use(requireAuth)
  .handler(async ({ context: { db }, input: { agentToolId } }) => {
    await db.queries.agentMcpTools.remove({ id: agentToolId });

    return { id: agentToolId };
  });

export const agentMcpServersRouter = {
  agentMcpServers: {
    listWithTools: listAgentMcpServers,
    addTool: addTool,
    removeTool: removeTool,
  },
};
