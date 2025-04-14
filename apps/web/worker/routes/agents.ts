import { base, requireAuth } from '../middleware.ts';

const listAgents = base
  .use(requireAuth)
  .route({ method: 'GET', path: '/agents' })
  .handler(async ({ context: { db, session } }) => {
    return db.queries.agents.byUserId({ userId: session.userId });
  });

export const agentsRouter = {
  agents: {
    list: listAgents,
  },
};
