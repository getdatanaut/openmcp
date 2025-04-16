import { base } from './middleware.ts';
import { agentsRouter } from './routes/agents.ts';
import { mpcServersRouter } from './routes/mcp-servers.ts';

export const router = base.router({
  agents: agentsRouter.agents,
  mcpServers: mpcServersRouter.mcpServers,
});
