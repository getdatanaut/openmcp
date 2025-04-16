import { base, requireAuth } from '../middleware.ts';

const listAgents = base.agents.list.use(requireAuth).handler(async ({ context: { db, session } }) => {
  return db.queries.agents.listByUserId({ userId: session.userId });
});

export const agentsRouter = {
  agents: {
    list: listAgents,
  },
};
