import { install, type IntegrationName, integrations } from '@openmcp/host-utils/mcp';
import type { Argv, CommandModule } from 'yargs';

import console from '#libs/console';

import { createHandler } from '../../cli-utils/index.ts';
import { getAgentById } from '../../libs/datanaut/agent.ts';
import createOpenAPIRemix from './openapi/index.ts';

export const builder = (yargs: Argv) =>
  yargs.strict().options({
    type: {
      choices: ['agent-id', 'openapi'] as const,
      describe:
        'To force the type of the input. By default, values starting with `ag_` are considered agent-id, otherwise it is considered OpenAPI spec.',
    },
    client: {
      choices: Object.keys(integrations) as IntegrationName[],
      describe: 'The name of the client to install agent for',
      demandOption: true,
    },
  });

export default {
  describe: 'Install the agent',
  command: 'install <agent-id-or-openapi-spec>',
  builder,
  handler: createHandler(async args => {
    const { agentIdOrOpenapiSpec, client, type } = args as Awaited<ReturnType<typeof builder>['argv']> & {
      agentIdOrOpenapiSpec: string;
    };
    const remix =
      (agentIdOrOpenapiSpec.startsWith('ag_') && type !== 'openapi') || type === 'agent-id'
        ? await getAgentById(agentIdOrOpenapiSpec)
        : await createOpenAPIRemix(agentIdOrOpenapiSpec);
    await install(console, client, remix);
  }),
} satisfies CommandModule;
