import { agentsRouter } from './routes/agents.ts';
import { mpcServersRouter } from './routes/mcp-servers.ts';

export const router = {
  agents: agentsRouter.agents,
  mcpServers: mpcServersRouter.mcpServers,
};
