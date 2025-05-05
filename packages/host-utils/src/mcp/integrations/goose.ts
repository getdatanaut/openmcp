import { z } from 'zod';

import { writeConfig } from '../config/index.ts';
import { ServerNotInstalled } from '../errors/index.ts';
import type { FsInstallMethod, McpHostClient, Server } from '../types.ts';
import findExistingServer from './utils/find-existing-server.ts';
import findMatchingInstallMethod from './utils/find-matching-install-method.ts';
import generateServerName from './utils/generate-server-name.ts';
import generateTransport from './utils/generate-transport.ts';
import { assertNoExistingServer } from './utils/guards.ts';
import type { InstalledServer } from './utils/types.ts';

const CONFIG_SCHEMA = z
  .object({
    extensions: z.record(z.unknown()).optional(),
  })
  .passthrough();

type Config = z.infer<typeof CONFIG_SCHEMA>;

const SERVER_SCHEMA = z
  .object({
    cmd: z.literal('npx'),
    args: z.array(z.string()),
  })
  .passthrough();

type VSCodeClient = McpHostClient<[FsInstallMethod<Config>]>;

export default function createGooseClient(): VSCodeClient {
  return {
    name: 'goose',
    installMethods: [
      {
        type: 'fs',
        filepath: '$HOME/.config/goose/config.yaml',
        schema: CONFIG_SCHEMA,
        location: 'global',
      },
    ] as const,
    async install(ctx, server, location) {
      const installMethod = findMatchingInstallMethod(this.installMethods, server, location);
      await writeConfig(ctx, installMethod, async config => {
        const servers = listServers(config);
        assertNoExistingServer(servers, server);
        const name = generateServerName(servers, server);
        config.extensions ??= {};
        config.extensions[name] = generateGooseTransport(server);
      });
      return installMethod;
    },
    async uninstall(ctx, server, location) {
      const installMethod = findMatchingInstallMethod(this.installMethods, server, location);
      await writeConfig(ctx, installMethod, async config => {
        const servers = listServers(config);
        const index = findExistingServer(servers, server);
        if (index === -1) {
          throw new ServerNotInstalled(server);
        }

        delete config.extensions![servers[index]!.name];
      });
      return installMethod;
    },
  };
}

function listServers(config: Config): readonly InstalledServer[] {
  if (!config.extensions) return [];

  const installedServers: InstalledServer[] = [];
  for (const [name, maybeServer] of Object.entries(config.extensions)) {
    const result = SERVER_SCHEMA.safeParse(maybeServer);
    if (result.success) {
      installedServers.push({
        name,
        command: result.data.cmd,
        args: result.data.args,
      });
    }
  }

  return installedServers;
}

function generateGooseTransport(server: Server) {
  const { args, command } = generateTransport(server);
  return {
    args,
    bundled: null,
    cmd: command,
    description: null,
    enabled: true,
    env_keys: [],
    envs: {},
    name: server.name,
    timeout: 300,
    type: 'stdio',
  };
}
