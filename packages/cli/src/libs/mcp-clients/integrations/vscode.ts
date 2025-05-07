import { z } from 'zod';

import { inferTargetType } from '../../mcp-utils/index.ts';
import { type ResolvableConfigPath, resolveConfigPath, writeConfig } from '../config/index.ts';
import { ServerNotInstalled } from '../errors/index.ts';
import type {
  Context,
  FsInstallMethod,
  InstallMethod,
  InstallMethodLocation,
  McpHostClient,
  Server,
} from '../types.ts';
import findExistingServer from './utils/find-existing-server.ts';
import generateDefinitionWorkspacePath from './utils/generate-definition-workspace-path.ts';
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
          await writeConfig(ctx, this.installMethods[0], async (config, configFilepath) => {
            addServer((config.mcp ??= {}), server, configFilepath, 'global');
          });
          return this.installMethods[0];
        case 'local':
        case 'prefer-local':
          await writeConfig(ctx, this.installMethods[1], async (config, configFilepath) => {
            addServer(config, resolveServer(ctx, this.installMethods[1], server), configFilepath, 'local');
          });
          return this.installMethods[1];
      }
    },
    async uninstall(ctx, server, location) {
      switch (location) {
        case 'global':
          await writeConfig(ctx, this.installMethods[0], async (config, configFilepath) => {
            removeServer(config.mcp, server, configFilepath);
          });
          return this.installMethods[0];
        case 'local':
        case 'prefer-local':
          await writeConfig(ctx, this.installMethods[1], async (config, configFilepath) => {
            removeServer(config, resolveServer(ctx, this.installMethods[1], server), configFilepath);
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

function addServer(config: McpConfig, server: Server, configFilepath: string, location: InstallMethodLocation) {
  const servers = listServers(config);
  assertNoExistingServer(configFilepath, servers, server);
  const name = generateServerName(servers, server);
  config.servers ??= {};
  config.servers[name] = {
    type: 'stdio',
    ...generateTransport(server),
  };
}

function resolveServer(ctx: Context, installMethod: InstallMethod, server: Server) {
  if (inferTargetType(server.target) !== 'openapi') {
    return server;
  }

  const resolvedPath = resolveConfigPath(ctx.constants, installMethod.filepath);
  return {
    ...server,
    target: generateDefinitionWorkspacePath('${workspaceFolder}/.vscode', resolvedPath, server.target),
  };
}

function removeServer(config: McpConfig | undefined, server: Server, configFilepath: string) {
  const servers = listServers(config);
  const index = findExistingServer(configFilepath, servers, server);
  if (index === -1) {
    throw new ServerNotInstalled(server);
  }

  delete config!.servers![servers[index]!.name];
}
