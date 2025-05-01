import { type IntegrationName, integrations, uninstall } from '@openmcp/host-utils/mcp';
import type { Argv, CommandModule } from 'yargs';

import console from '#libs/console';

import { createHandler } from '../../cli-utils/index.ts';
import { getAgentById } from '../../libs/datanaut/agent.ts';

export const builder = (yargs: Argv) =>
  yargs.strict().options({
    client: {
      choices: Object.keys(integrations) as IntegrationName[],
      describe: 'The name of the client to install agent for',
      demandOption: true,
    },
  });

export default {
  describe: process.env['NODE_ENV'] === 'development' ? 'Uninstall the agent' : false,
  command: 'uninstall <agent-id>',
  builder,
  handler: createHandler(async args => {
    const { agentId, client } = args as Awaited<ReturnType<typeof builder>['argv']> & { agentId: string };
    const agent = await getAgentById(agentId);
    await uninstall(console, client, agent);
  }),
} satisfies CommandModule;
