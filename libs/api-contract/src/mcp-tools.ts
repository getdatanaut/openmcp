import { McpServerId } from '@libs/db-ids';
import type { McpToolSummarySelect } from '@libs/db-pg';
import { type } from '@orpc/contract';
import { z } from 'zod';

import { base } from './base.ts';

const listMcpToolsContract = base
  .input(z.object({ serverId: McpServerId.validator }))
  .output(type<McpToolSummarySelect[]>())
  .errors({ NOT_FOUND: {} });

export const mpcToolsRouterContract = {
  mcpTools: {
    list: listMcpToolsContract,
  },
};
