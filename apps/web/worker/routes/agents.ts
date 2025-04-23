import { base, requireAuth } from '../middleware.ts';

const listAgents = base.agents.list.use(requireAuth).handler(async ({ context: { db, organizationId } }) => {
  return db.queries.agents.listByOrganizationId({ organizationId });
});

// @TODO permissions
const getAgent = base.agents.get.use(requireAuth).handler(async ({ context: { db }, input: { id }, errors }) => {
  const agent = await db.queries.agents.getById({ id });
  if (!agent) {
    throw errors.NOT_FOUND();
  }

  return agent;
});

const createAgent = base.agents.create
  .use(requireAuth)
  .handler(async ({ context: { db, user, organizationId }, input }) => {
    let name = input.name;
    if (!name) {
      const agents = await db.queries.agents.listByOrganizationId({ organizationId });
      name = `Agent ${agents.length + 1}`;
    }

    return db.queries.agents.create({
      organizationId,
      createdBy: user.id,
      name,
    });
  });

export const agentsRouter = {
  agents: {
    list: listAgents,
    get: getAgent,
    create: createAgent,
  },
};
