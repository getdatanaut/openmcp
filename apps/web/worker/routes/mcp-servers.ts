import { base } from '../middleware.ts';

const listMcpServers = base.route({ method: 'GET', path: '/mcp-servers' }).handler(async ({ context: { db } }) => {
  return db.queries.mcpServers.list();
});

export const mpcServersRouter = {
  mcpServers: {
    list: listMcpServers,
  },
};
