import type { TransportConfig } from '@openmcp/manager';

import type { RemixServer, SSEServer } from '../../config';
import type { StreamableHTTPServer } from '../../config/schemas.ts';
import strictReplaceVariables from '../../utils/strict-replace-variables.ts';

function getHttpConfig(
  { url, headers }: StreamableHTTPServer | SSEServer,
  userConfig: unknown,
): TransportConfig['config'] {
  return {
    url: strictReplaceVariables(url, userConfig),
    requestInit: {
      headers: headers
        ? Object.entries(headers).reduce(
            (acc, [key, value]) => {
              acc[key] = strictReplaceVariables(value, userConfig);
              return acc;
            },
            {} as Record<string, string>,
          )
        : undefined,
    },
  };
}

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
    case 'streamable-http':
      return {
        type: 'streamableHttp',
        config: getHttpConfig(server, userConfig),
      };
    case 'sse':
      return {
        type: 'sse',
        config: getHttpConfig(server, userConfig),
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
