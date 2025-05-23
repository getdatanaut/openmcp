import { type ClientConfig } from '@openmcp/openapi';

import strictReplaceVariables from '../../utils/strict-replace-variables.ts';

export default function interpolateOpenAPIClientConfig(
  config: Record<string, unknown>,
  userConfig: unknown,
): ClientConfig {
  if (!config) {
    return {};
  }

  const interpolatedConfig: ClientConfig = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object' && value !== null) {
      interpolatedConfig[key] = Object.entries(value).reduce(
        (acc, [k, v]) => {
          acc[k] = typeof v === 'string' ? strictReplaceVariables(v, userConfig) : v;
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }
  }

  return interpolatedConfig;
}
