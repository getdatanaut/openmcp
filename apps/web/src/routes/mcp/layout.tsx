import { McpServerId } from '@libs/db-ids';
import { createFileRoute, retainSearchParams } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/mcp')({
  validateSearch: z.object({
    serverTab: z.enum(['tools', 'config']).optional(),
    serverId: McpServerId.validator.optional(),
  }),
  search: {
    middlewares: [retainSearchParams(['serverTab', 'serverId'])],
  },
});
