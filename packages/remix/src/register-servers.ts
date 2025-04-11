import { type McpManager, Server, type ServerStorageData, type TransportConfig } from '@openmcp/manager';
import {
  type ClientConfig,
  openApiToMcpServerOptions,
  type ServerConfig as OpenAPIServerConfig,
} from '@openmcp/openapi';
import { OpenMcpServer } from '@openmcp/server';

import type { Config, OpenAPIServer, RemixServer } from './config/index.ts';
import { ServerRegistrationError } from './errors.ts';
import strictReplaceVariables from './utils/strict-replace-variables.ts';

function toTransportConfig(server: RemixServer, userConfig: unknown): TransportConfig {
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

// @todo: move this elsewhere
function interpolateOpenAPIClientConfig(config: OpenAPIServer['clientConfig'], userConfig: unknown): ClientConfig {
  if (!config) {
    return {};
  }

  const interpolatedConfig: ClientConfig = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object' && value !== null) {
      interpolatedConfig[key] = Object.entries(value).reduce(
        (acc, [k, v]) => {
          acc[k] = typeof v === 'string' ? maybeReplaceVariables(v, userConfig) : v;
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }
  }

  return interpolatedConfig;
}

async function registerServer(manager: McpManager, name: string, remixServer: RemixServer, userConfig: unknown) {
  const definition: ServerStorageData = {
    id: name,
    name,
    // we don't have any information about the version atm
    version: '1.0.0',
    transport: toTransportConfig(remixServer, userConfig),
  };
  let server;
  if (remixServer.type === 'openapi') {
    const clientConfig = interpolateOpenAPIClientConfig(remixServer.clientConfig, userConfig);
    server = Server.deserialize<OpenAPIServerConfig>(definition, {
      manager,
      async createServer(config) {
        const opts = await openApiToMcpServerOptions(config, () => clientConfig);
        return new OpenMcpServer(opts);
      },
    });
  } else {
    server = Server.deserialize(definition, { manager });
  }

  await manager.servers.add(server);
  return server;
}

export default async function registerServers(manager: McpManager, { configs, servers }: Config) {
  const nameServerPairs = Object.entries(servers);
  const results = await Promise.allSettled(
    nameServerPairs.map(([name, server]) => registerServer(manager, name, server, configs[name])),
  );

  const errors: ServerRegistrationError[] = [];
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      errors.push(new ServerRegistrationError(nameServerPairs[i]![0], result.reason));
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, 'Failed to register some servers');
  }
}
