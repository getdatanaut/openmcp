import { base } from './middleware.ts';
import { agentsRouter } from './routes/agents.ts';
import { mpcServersRouter } from './routes/mcp-servers.ts';
import { mpcToolsRouter } from './routes/mcp-tools.ts';

export const router = base.router({
  agents: agentsRouter.agents,
  mcpServers: mpcServersRouter.mcpServers,
  mcpTools: mpcToolsRouter.mcpTools,
});
