import { constants as osConstants } from '#libs/platform';

import { resolveConfigPath } from './config/index.ts';
import { type IntegrationName, integrations } from './integrations/index.ts';
import findMatchingInstallMethod from './integrations/utils/find-matching-install-method.ts';
import type { InstallLocation } from './types.ts';

export default function getInstallFilepath(
  cwd: string,
  integrationName: IntegrationName,
  location: InstallLocation,
): string | null {
  const integration = integrations[integrationName];
  const installMethod = findMatchingInstallMethod(integration.installMethods, location);
  if (installMethod === null) return null;

  const constants = {
    ...osConstants,
    CWD: cwd,
  } as const;
  return resolveConfigPath(constants, installMethod.filepath);
}
