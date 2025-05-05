import { z } from 'zod';

import { type ResolvableConfigPath, writeConfig } from '../config/index.ts';
import { ServerNotInstalled } from '../errors/index.ts';
import type { FsInstallMethod, InstallMethodLocation, McpHostClient, Server } from '../types.ts';
import findExistingServer from './utils/find-existing-server.ts';
import generateServerName from './utils/generate-server-name.ts';
import generateTransport from './utils/generate-transport.ts';
import { assertNoExistingServer } from './utils/guards.ts';
import parseGenericServer from './utils/parse-generic-server.ts';
import type { InstalledServer } from './utils/types.ts';

const MCP_CONFIG_SCHEMA = z
  .object({
    servers: z.record(z.unknown()).optional(),
  })
  .passthrough();

const GLOBAL_CONFIG_SCHEMA = z
  .object({
    mcp: MCP_CONFIG_SCHEMA.optional(),
  })
  .passthrough();

type GlobalConfig = z.infer<typeof GLOBAL_CONFIG_SCHEMA>;
type McpConfig = z.infer<typeof MCP_CONFIG_SCHEMA>;

type VSCodeClient = McpHostClient<[FsInstallMethod<GlobalConfig>, FsInstallMethod<McpConfig>]>;

export default function createVSCodeClient(
  name: 'vscode' | 'vscode-insiders',
  paths: Record<InstallMethodLocation, ResolvableConfigPath>,
): VSCodeClient {
  return {
    name,
    installMethods: [
      {
        type: 'fs',
        filepath: paths.global,
        location: 'global',
        schema: GLOBAL_CONFIG_SCHEMA,
      },
      {
        type: 'fs',
        filepath: paths.local,
        location: 'local',
        schema: MCP_CONFIG_SCHEMA,
      },
    ],
    async install(ctx, server, location) {
      switch (location) {
        case 'global':
          await writeConfig(ctx, this.installMethods[0], async config => {
            addServer((config.mcp ??= {}), server);
          });
          return this.installMethods[0];
        case 'local':
        case 'prefer-local':
          await writeConfig(ctx, this.installMethods[1], async config => {
            addServer(config, server);
          });
          return this.installMethods[1];
      }
    },
    async uninstall(ctx, server, location) {
      switch (location) {
        case 'global':
          await writeConfig(ctx, this.installMethods[0], async config => {
            removeServer(config.mcp, server);
          });
          return this.installMethods[0];
        case 'local':
        case 'prefer-local':
          await writeConfig(ctx, this.installMethods[1], async config => {
            removeServer(config, server);
          });
          return this.installMethods[1];
      }
    },
  };
}

function listServers(config: McpConfig | undefined): readonly InstalledServer[] {
  if (!config?.servers) return [];

  const installedServers: InstalledServer[] = [];
  for (const [name, maybeServer] of Object.entries(config.servers)) {
    const server = parseGenericServer(maybeServer);
    if (server !== null) {
      installedServers.push({
        name,
        command: server.command,
        args: server.args,
      });
    }
  }

  return installedServers;
}

function addServer(config: McpConfig, server: Server) {
  const servers = listServers(config);
  assertNoExistingServer(servers, server);
  const name = generateServerName(servers, server);
  config.servers ??= {};
  config.servers[name] = generateVSCodeTransport(server);
}

function removeServer(config: McpConfig | undefined, server: Server) {
  const servers = listServers(config);
  const index = findExistingServer(servers, server);
  if (index === -1) {
    throw new ServerNotInstalled(server);
  }

  delete config!.servers![servers[index]!.name];
}

function generateVSCodeTransport(server: Server) {
  return {
    type: 'stdio',
    ...generateTransport(server),
  };
}
