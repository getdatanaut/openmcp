import * as fs from 'node:fs/promises';

import { constants as osConstants, getPlatform as platform } from '#libs/platform';

import resolveConfigPath from './config/resolve-path.ts';
import { ServerNotInstalled } from './errors/index.ts';
import { type IntegrationName, integrations } from './integrations/index.ts';
import type { InstallLocation, Logger, Server } from './types.ts';

export default async function uninstall(
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
  logger.start(`Uninstalling ${serverName}`);
  try {
    const constants = {
      ...osConstants,
      CWD: cwd,
    };
    const { filepath } = await integration.uninstall(
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
    logger.success(`${serverName} was successfully uninstalled from ${JSON.stringify(resolvedConfigPath)}`);
  } catch (error) {
    if (error instanceof ServerNotInstalled) {
      logger.info(
        `${serverName} is not installed. If your server is installed globally, you need to change scope to global.`,
      );
      return;
    }

    logger.error(new Error(`Failed to uninstall ${serverName}`, { cause: error }));
  }
}
