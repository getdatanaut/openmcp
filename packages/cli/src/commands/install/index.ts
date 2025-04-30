import { install, type IntegrationName, integrations } from '@openmcp/host-utils/mcp';
import type { Argv, CommandModule } from 'yargs';

import console from '#libs/console';

import { createHandler } from '../../cli-utils/index.ts';
import { getAgentById } from '../../libs/datanaut/agent.ts';
import createOpenAPIRemix from './openapi/index.ts';

export const builder = (yargs: Argv) =>
  yargs
    .strict()
    .positional('agent-id', {
      type: 'string',
      describe: 'The ID of the agent to install',
      demandOption: false,
      conflicts: ['openapi'],
    })
    .options({
      openapi: {
        type: 'string',
        describe: 'OpenAPI spec to install',
        conflicts: ['agent-id'],
      },
      client: {
        choices: Object.keys(integrations) as IntegrationName[],
        describe: 'The name of the client to install agent for',
        demandOption: true,
      },
    })
    .check(args => {
      if (args['agent-id'] === undefined && args.openapi === undefined) {
        throw new Error('Either agent-id or openapi is required');
      }

      return true;
    });

export default {
  describe: 'Install the agent',
  command: 'install',
  builder,
  handler: createHandler(async args => {
    const { agentId, openapi, client } = args as Awaited<ReturnType<typeof builder>['argv']>;
    const remix = agentId ? await getAgentById(agentId) : await createOpenAPIRemix(openapi!);
    await install(console, client, remix);
  }),
} satisfies CommandModule;
