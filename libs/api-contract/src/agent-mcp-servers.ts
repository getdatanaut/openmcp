import type { TAgentMcpToolId } from '@libs/db-ids';
import { AgentId, AgentMcpToolId, McpToolId } from '@libs/db-ids';
import type { AgentMcpServerSummarySelect, AgentMcpToolSummarySelect } from '@libs/db-pg';
import { type } from '@orpc/contract';
import { z } from 'zod';

import { base } from './base.ts';

const listWithToolsContract = base
  .input(z.object({ agentId: AgentId.validator }))
  .output(type<(AgentMcpServerSummarySelect & { tools: AgentMcpToolSummarySelect[] })[]>())
  .errors({ NOT_FOUND: {} });

const addToolContract = base
  .input(z.object({ agentId: AgentId.validator, toolId: McpToolId.validator }))
  .output(type<{ id: TAgentMcpToolId }>())
  .errors({ NOT_FOUND: {} });

const removeToolContract = base
  .input(z.object({ agentToolId: AgentMcpToolId.validator }))
  .output(type<{ id: TAgentMcpToolId }>())
  .errors({ NOT_FOUND: {} });

export const agentMcpServersRouterContract = {
  agentMcpServers: {
    listWithTools: listWithToolsContract,
    addTool: addToolContract,
    removeTool: removeToolContract,
  },
};
