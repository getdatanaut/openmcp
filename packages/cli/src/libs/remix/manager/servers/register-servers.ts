import { type McpManager, Server, type ServerStorageData } from '@openmcp/manager';
import { openApiToMcpServerOptions, type ServerConfig as OpenAPIServerConfig } from '@openmcp/openapi';
import { OpenMcpServer } from '@openmcp/server';

import type { Config, RemixServer } from '../../config/index.ts';
import { ServerRegistrationError } from '../../errors.ts';
import interpolateOpenAPIClientConfig from './interpolate-openapi-client-config.ts';
import toTransportConfig from './to-transport-config.ts';

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
    const clientConfig = interpolateOpenAPIClientConfig(
      {
        path: remixServer.path,
        query: remixServer.query,
        headers: remixServer.headers,
        body: remixServer.body,
      },
      userConfig,
    );
    server = Server.deserialize<OpenAPIServerConfig>(definition, {
      manager,
      async createServer(config) {
        const { options } = await openApiToMcpServerOptions(config, {
          getClientConfig: () => clientConfig,
        });
        return new OpenMcpServer(options);
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
