import { agentsRouter } from './agents.ts';
import { mcpServersRouter } from './mcp-servers.ts';

export const cliRouter = {
  ...agentsRouter,
  ...mcpServersRouter,
};
