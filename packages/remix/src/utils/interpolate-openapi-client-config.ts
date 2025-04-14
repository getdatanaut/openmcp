import { type ClientConfig } from '@openmcp/openapi';

import type { OpenAPIServer } from '../config/index.ts';
import strictReplaceVariables from './strict-replace-variables.ts';

export default function interpolateOpenAPIClientConfig(
  config: OpenAPIServer['clientConfig'],
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
