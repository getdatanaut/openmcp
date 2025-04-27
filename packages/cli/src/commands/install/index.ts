import { AgentId, type TAgentId } from '@libs/db-ids';
import { install, type IntegrationName, integrations } from '@libs/host-utils/mcp';
import type { Argv, CommandModule } from 'yargs';

import { createHandler } from '../../cli-utils/index.ts';
import consola from '../../consola/index.ts';
import { getAgentById } from '../../libs/datanaut/agent.ts';

export const builder = (yargs: Argv) =>
  yargs
    .strict()
    .positional('agent-id', {
      type: 'string',
      describe: 'The ID of the agent to install',
      demandOption: true,
    })
    .options({
      client: {
        choices: Object.keys(integrations) as IntegrationName[],
        describe: 'The name of the client to install agent for',
        demandOption: true,
      },
    })
    .check(({ agentId }) => {
      if (!AgentId.isValid(agentId)) {
        throw new Error(`Invalid agent ID: ${agentId}`);
      }
      return true;
    });

export default {
  describe: 'Install the agent',
  command: 'install <agent-id>',
  builder,
  handler: createHandler(async args => {
    const { agentId, client } = args as Awaited<ReturnType<typeof builder>['argv']>;
    const remix = await getAgentById(agentId as TAgentId);
    await install(consola, client, remix);
  }),
} satisfies CommandModule;
