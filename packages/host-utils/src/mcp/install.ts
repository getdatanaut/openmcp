import * as fs from 'node:fs/promises';

import * as constants from '../constants.ts';
import platform from '../platform.ts';
import { RemixConflict } from './errors/index.ts';
import { type IntegrationName, integrations } from './integrations/index.ts';
import type { Logger, Remix } from './types.ts';

export default async function install(logger: Logger, integrationName: IntegrationName, remix: Remix): Promise<void> {
  const integration = integrations[integrationName];
  const remixName = JSON.stringify(remix.name);
  logger.start(`Installing remix ${remixName}`);
  try {
    await integration.install(
      {
        platform: platform(),
        constants,
        fs,
        logger,
      },
      remix,
    );
  } catch (error) {
    if (error instanceof RemixConflict) {
      logger.info(`Remix ${remixName} is already installed. Skipping install`);
      return;
    }

    logger.error(new Error(`Failed to install remix ${remixName}`, { cause: error }));
  }

  logger.success(`Remix ${remixName} was successfully installed`);
}
