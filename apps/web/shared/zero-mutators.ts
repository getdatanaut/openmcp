import { AgentId, AgentMcpServerId, AgentMcpToolId, McpServerId, McpToolId } from '@libs/db-ids';
import type { EncryptedAgentMcpServerConfig } from '@libs/db-pg';
import { encryptConfig } from '@libs/db-pg/crypto';
import type { CustomMutatorDefs } from '@rocicorp/zero';
import { z } from 'zod';

import { assert, assertFound, assertIsLoggedInWithOrg, assertIsRecordOwner, type AuthData } from './auth.ts';
import {
  canReadAgent,
  canReadAgentMcpServer,
  canReadAgentMcpTool,
  canReadMcpServer,
  canReadMcpTool,
  type Schema,
} from './zero-schema.ts';

export type PostCommitTask = () => Promise<void>;

export interface ServerMutatorsOpts {
  dbEncSecret: string;
  postCommitTasks: PostCommitTask[];
}

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

const ClientConfigSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .optional()
  .nullable();

const UpdateAgentMcpServerSchema = z.object({
  id: AgentMcpServerId.validator,
  configJson: ClientConfigSchema,
});

const CreateAgentMcpServerSchema = z.object({
  id: AgentMcpServerId.validator.optional(),
  agentId: AgentId.validator,
  mcpServerId: McpServerId.validator,
  configJson: ClientConfigSchema,
});

function assertServerOpts(serverOpts: ServerMutatorsOpts | undefined): asserts serverOpts {
  assert(serverOpts, 'serverOpts must be passed in on the server.');
}

// @TODO proper error types + consolidate thrown error objects w what the orpc api throws

/**
 * NOTE: db reads in custom mutators do NOT have permissions automatically applied. More info here:
 *
 * - https://discord.com/channels/830183651022471199/1365112008407519353
 */

export function createMutators(authData: AuthData | undefined, serverOpts: ServerMutatorsOpts | undefined) {
  // Based the idea in https://discord.com/channels/830183651022471199/1365112008407519353/1365385406291509308
  // but definePermissions returns a promise and passing fns in as we do below isn't too bad so just sticking w that for now
  // function applyPermissions(table: AnyTableName) {
  //   return (eb: ExpressionBuilder<Schema, AnyTableName>) =>
  //     eb.or(permissions[table].row?.select.map(r => () => r(authData, eb)) ?? []);
  // }

  return {
    agents: {
      async insert(tx, props: z.infer<typeof CreateAgentSchema> = {}) {
        assertIsLoggedInWithOrg(authData);

        const data = CreateAgentSchema.parse(props);

        let name = data.name;
        if (!name) {
          const agents = await tx.query.agents.where(eb => canReadAgent(authData, eb)).run();
          name = `Remix ${agents.length + 1}`;
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

        const agent = await tx.query.agents
          .where('id', data.agentId)
          .where(eb => canReadAgent(authData, eb))
          .one()
          .run();
        assertFound(agent, 'Agent not found');

        const tool = await tx.query.mcpTools
          .where('id', data.mcpToolId)
          .where(eb => canReadMcpTool(authData, eb))
          .one()
          .run();
        assertFound(tool, 'Tool not found');

        const agentServer = await tx.query.agentMcpServers
          .where('agentId', agent.id)
          .where('mcpServerId', tool.mcpServerId)
          .where(eb => canReadAgentMcpServer(authData, eb))
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

        const data = RemoveAgentMcpToolSchema.parse(props);

        const existing = await tx.query.agentMcpTools
          .where('id', data.id)
          .where(eb => canReadAgentMcpTool(authData, eb))
          .one()
          .run();
        assertFound(existing, 'Agent MCP tool not found');

        const agent = await tx.query.agents
          .where('id', existing.agentId)
          .where(eb => canReadAgent(authData, eb))
          .one()
          .run();
        assertFound(agent, 'Agent not found');
        assertIsRecordOwner(authData, agent);

        await tx.mutate.agentMcpTools.delete({ id: data.id });
      },
    },

    agentMcpServers: {
      async insert(tx, props: z.infer<typeof CreateAgentMcpServerSchema>) {
        assertIsLoggedInWithOrg(authData);

        const data = CreateAgentMcpServerSchema.parse(props);

        const mcpServer = await tx.query.mcpServers
          .where('id', data.mcpServerId)
          .where(eb => canReadMcpServer(authData, eb))
          .one()
          .run();
        assertFound(mcpServer, 'MCP server not found');

        let configJson = data.configJson as EncryptedAgentMcpServerConfig;
        if (import.meta.env.SSR) {
          assertServerOpts(serverOpts);
          if (configJson) {
            configJson = await encryptConfig({
              config: configJson,
              schema: mcpServer.configSchemaJson,
              secret: serverOpts.dbEncSecret,
            });
          }
        }

        await tx.mutate.agentMcpServers.insert({
          id: data.id ?? AgentMcpServerId.generate(),
          agentId: data.agentId,
          mcpServerId: data.mcpServerId,
          configJson,
          organizationId: authData.orgId,
          createdBy: authData.sub,
        });
      },

      async update(tx, props: z.infer<typeof UpdateAgentMcpServerSchema>) {
        assertIsLoggedInWithOrg(authData);

        const data = UpdateAgentMcpServerSchema.parse(props);

        const existing = await tx.query.agentMcpServers
          .where('id', data.id)
          .where(eb => canReadAgentMcpServer(authData, eb))
          .one()
          .run();
        assertFound(existing, 'Agent MCP server not found');
        assertIsRecordOwner(authData, existing);

        const mcpServer = await tx.query.mcpServers
          .where('id', existing.mcpServerId)
          .where(eb => canReadMcpServer(authData, eb))
          .one()
          .run();
        assertFound(mcpServer, 'MCP server not found');

        let configJson = data.configJson as EncryptedAgentMcpServerConfig;
        if (import.meta.env.SSR) {
          assertServerOpts(serverOpts);
          if (configJson) {
            configJson = await encryptConfig({
              config: configJson,
              schema: mcpServer.configSchemaJson,
              secret: serverOpts.dbEncSecret,
            });
          }
        }

        await tx.mutate.agentMcpServers.update({ id: data.id, configJson });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
