import * as fs from 'node:fs/promises';
import path from 'node:path';

import type { Argv, CommandModule } from 'yargs';

import { createHandler } from '#libs/cli-utils';
import { type IntegrationName, integrations } from '#libs/mcp-clients';

import handler from './handler.ts';

const isDev = process.env['NODE_ENV'] === 'development';

export const builder = (yargs: Argv) =>
  yargs
    .strict()
    .options({
      type: {
        choices: isDev ? (['agent-id', 'openapi'] as const) : (['openapi'] as const),
        describe: isDev
          ? 'To force the type of the target. By default, targets starting with `ag_` are considered agent-id, otherwise they are considered OpenAPI spec.'
          : 'To force the type of the target.',
      },
      scope: {
        choices: ['global', 'local', 'prefer-local'] as const,
        describe: 'The scope of the target',
      },
      client: {
        choices: Object.keys(integrations) as IntegrationName[],
        describe: 'The name of the client to install target for',
        demandOption: true,
      },
    })
    .middleware(async argv => {
      const s = await fs.stat(path.join(process.cwd(), '.git'));
      if (s.isDirectory()) {
        argv.scope = 'prefer-local';
      } else {
        argv.scope = 'global';
      }
    });

export type BuilderArgv = Awaited<ReturnType<typeof builder>['argv']> & {
  scope: NonNullable<Awaited<ReturnType<typeof builder>['argv']>['scope']>;
};

export default {
  describe: 'Install the target',
  command: 'install <target>',
  builder,
  handler: createHandler(async args => {
    const { target, client, type, scope } = args as BuilderArgv & {
      target: string;
    };

    await handler(target, {
      client,
      type,
      scope,
    });
  }, true),
} satisfies CommandModule;
