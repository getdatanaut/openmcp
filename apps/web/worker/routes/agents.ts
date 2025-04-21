import { base, requireAuth } from '../middleware.ts';

const listAgents = base.agents.list.use(requireAuth).handler(async ({ context: { db, user } }) => {
  return db.queries.agents.listByUserId({ userId: user.id });
});

// @TODO permissions
const getAgent = base.agents.get.use(requireAuth).handler(async ({ context: { db }, input: { id }, errors }) => {
  const agent = await db.queries.agents.getById({ id });
  if (!agent) {
    throw errors.NOT_FOUND();
  }

  return agent;
});

const createAgent = base.agents.create.use(requireAuth).handler(async ({ context: { db, user }, input }) => {
  let name = input.name;
  if (!name) {
    const agents = await db.queries.agents.listByUserId({ userId: user.id });
    name = `Agent ${agents.length + 1}`;
  }

  return db.queries.agents.create({ userId: user.id, name });
});

export const agentsRouter = {
  agents: {
    list: listAgents,
    get: getAgent,
    create: createAgent,
  },
};
