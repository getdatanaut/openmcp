import { uninstall } from '@openmcp/host-utils/mcp';
import type { CommandModule } from 'yargs';

import { createHandler } from '../../cli-utils/index.ts';
import consola from '../../consola/index.ts';
import { getAgentById } from '../../libs/datanaut/agent.ts';
import { builder } from '../install/index.ts';

export default {
  describe: 'Uninstall the agent',
  command: 'uninstall <agent-id>',
  builder,
  handler: createHandler(async args => {
    const { agentId, client } = args as Awaited<ReturnType<typeof builder>['argv']>;
    const agent = await getAgentById(agentId);
    await uninstall(consola, client, agent);
  }),
} satisfies CommandModule;
