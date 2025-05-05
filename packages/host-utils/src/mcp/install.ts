import * as fs from 'node:fs/promises';

import * as osConstants from '../constants.ts';
import platform from '../platform.ts';
import resolveConfigPath from './config/resolve-path.ts';
import { ServerConflict } from './errors/index.ts';
import { type IntegrationName, integrations } from './integrations/index.ts';
import type { InstallLocation, Logger, Server } from './types.ts';

export default async function install(
  {
    cwd,
    logger,
  }: {
    readonly cwd: string;
    readonly logger: Logger;
  },
  integrationName: IntegrationName,
  server: Server,
  location: InstallLocation,
): Promise<void> {
  const integration = integrations[integrationName];
  const serverName = JSON.stringify(server.name);
  logger.start(`Installing ${serverName}`);
  try {
    const constants = {
      ...osConstants,
      CWD: cwd,
    } as const;
    const { filepath } = await integration.install(
      {
        platform: platform(),
        constants,
        fs,
        logger,
      },
      server,
      location,
    );

    const resolvedConfigPath = resolveConfigPath(constants, filepath);
    logger.success(`${serverName} was successfully installed to ${JSON.stringify(resolvedConfigPath)}`);
  } catch (error) {
    if (error instanceof ServerConflict) {
      logger.info(
        `${serverName} is already installed. You may need to restart your target client for changes to take affect.`,
      );
      return;
    }

    logger.error(new Error(`Failed to install ${serverName}`, { cause: error }));
    return;
  }
}
