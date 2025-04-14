import type { TransportConfig } from '@openmcp/manager';

import type { RemixServer } from '../../config';
import strictReplaceVariables from '../../utils/strict-replace-variables.ts';

export default function toTransportConfig(server: RemixServer, userConfig: unknown): TransportConfig {
  switch (server.type) {
    case 'stdio':
      return {
        type: 'stdio',
        config: {
          command: strictReplaceVariables(server.command, userConfig),
          args: server.args.map(arg => strictReplaceVariables(arg, userConfig)),
        },
      };
    case 'sse':
      return {
        type: 'sse',
        config: {
          url: strictReplaceVariables(server.url, userConfig),
          requestInit: {
            headers: server.headers
              ? Object.entries(server.headers).reduce(
                  (acc, [key, value]) => {
                    acc[key] = strictReplaceVariables(value, userConfig);
                    return acc;
                  },
                  {} as Record<string, string>,
                )
              : undefined,
          },
        },
      };
    case 'openapi':
      return {
        type: 'inMemory',
        config: {},
      };
    default:
      throw new Error(`Unsupported transport type: ${server['type']}`);
  }
}
