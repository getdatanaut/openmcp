import { AgentId, AgentMcpServerId, AgentMcpToolId, McpToolId } from '@libs/db-ids';
import type { CustomMutatorDefs } from '@rocicorp/zero';
import { z } from 'zod';

import { assertFound, assertIsLoggedInWithOrg, assertIsRecordOwner, type AuthData } from './auth.ts';
import type { Schema } from './zero-schema.ts';

const CreateAgentSchema = z.object({
  id: AgentId.validator.optional(),
  name: z.string().min(2).max(100).optional(),
});

const CreateAgentMcpToolSchema = z.object({
  id: AgentMcpToolId.validator.optional(),
  agentId: AgentId.validator,
  mcpToolId: McpToolId.validator,
});

const RemoveAgentMcpToolSchema = z.object({
  id: AgentMcpToolId.validator,
});

// @TODO proper error types + consolidate thrown error objects w what the orpc api throws

export function createMutators(authData: AuthData | undefined) {
  return {
    agents: {
      async insert(tx, props: z.infer<typeof CreateAgentSchema> = {}) {
        assertIsLoggedInWithOrg(authData);

        const data = CreateAgentSchema.parse(props);

        let name = data.name;
        if (!name) {
          const agents = await tx.query.agents.run();
          name = `Agent ${agents.length + 1}`;
        }

        await tx.mutate.agents.insert({
          id: data.id ?? AgentId.generate(),
          name,
          organizationId: authData.orgId,
          createdBy: authData.sub,
        });
      },
    },

    agentMcpTools: {
      async insert(tx, props: z.infer<typeof CreateAgentMcpToolSchema>) {
        assertIsLoggedInWithOrg(authData);

        const data = CreateAgentMcpToolSchema.parse(props);

        const agent = await tx.query.agents.where('id', data.agentId).one().run();
        assertFound(agent, 'Agent not found');

        const tool = await tx.query.mcpTools.where('id', data.mcpToolId).one().run();
        assertFound(tool, 'Tool not found');

        const agentServer = await tx.query.agentMcpServers
          .where('agentId', agent.id)
          .where('mcpServerId', tool.mcpServerId)
          .one()
          .run();

        if (!agentServer) {
          await tx.mutate.agentMcpServers.insert({
            id: AgentMcpServerId.generate(),
            agentId: agent.id,
            mcpServerId: tool.mcpServerId,
            organizationId: authData.orgId,
            createdBy: authData.sub,
          });
        }

        await tx.mutate.agentMcpTools.insert({
          id: data.id ?? AgentMcpToolId.generate(),
          agentId: agent.id,
          mcpServerId: tool.mcpServerId,
          mcpToolId: tool.id,
          organizationId: authData.orgId,
          createdBy: authData.sub,
        });
      },

      async delete(tx, props: z.infer<typeof RemoveAgentMcpToolSchema>) {
        assertIsLoggedInWithOrg(authData);

        const existing = await tx.query.agentMcpTools.where('id', props.id).one().run();
        assertFound(existing, 'Agent MCP tool not found');

        const agent = await tx.query.agents.where('id', existing.agentId).one().run();
        assertFound(agent, 'Agent not found');
        assertIsRecordOwner(authData, agent);

        const data = RemoveAgentMcpToolSchema.parse(props);

        await tx.mutate.agentMcpTools.delete({ id: data.id });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
