import * as fs from 'node:fs/promises';

import * as constants from '../constants.ts';
import platform from '../platform.ts';
import { RemixNotInstalled } from './errors/index.ts';
import { type IntegrationName, integrations } from './integrations/index.ts';
import type { Logger, Remix } from './types.ts';

export default async function uninstall(logger: Logger, integrationName: IntegrationName, remix: Remix): Promise<void> {
  const integration = integrations[integrationName];
  const remixName = JSON.stringify(remix.name);
  logger.start(`Uninstalling remix ${remixName}`);
  try {
    await integration.uninstall(
      {
        platform: platform(),
        constants,
        fs,
        logger,
      },
      remix,
    );
  } catch (error) {
    if (error instanceof RemixNotInstalled) {
      logger.info(`Remix ${remixName} is not installed. Skipping uninstall`);
      return;
    }

    logger.error(new Error(`Failed to uninstall remix ${remixName}`, { cause: error }));
  }

  logger.success(`Remix ${remixName} was successfully uninstalled`);
}
