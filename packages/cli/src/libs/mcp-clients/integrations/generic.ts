import { z } from 'zod';

import { type ResolvableConfigPath, writeConfig } from '../config/index.ts';
import { ServerNotInstalled } from '../errors/index.ts';
import type { FsInstallMethod, InstallMethodLocation, McpHostClient } from '../types.ts';
import findExistingServer from './utils/find-existing-server.ts';
import findMatchingInstallMethod from './utils/find-matching-install-method.ts';
import generateServerName from './utils/generate-server-name.ts';
import generateTransport from './utils/generate-transport.ts';
import { assertNoExistingServer } from './utils/guards.ts';
import parseGenericServer from './utils/parse-generic-server.ts';
import type { InstalledServer } from './utils/types.ts';

const CONFIG_SCHEMA = z
  .object({
    mcpServers: z.record(z.unknown()).optional(),
  })
  .passthrough();

type Config = z.infer<typeof CONFIG_SCHEMA>;

type GenericClient = McpHostClient<FsInstallMethod<Config>[]>;

export default function createGenericClient(
  name: string,
  paths: Record<InstallMethodLocation, ResolvableConfigPath | null>,
): GenericClient {
  const installMethods: FsInstallMethod<Config>[] = [];
  for (const [location, filepath] of Object.entries(paths) as [InstallMethodLocation, ResolvableConfigPath][]) {
    if (filepath !== null) {
      installMethods.push({
        type: 'fs',
        filepath,
        location,
        schema: CONFIG_SCHEMA,
      });
    }
  }

  return {
    name,
    installMethods,
    async install(ctx, server, location) {
      const installMethod = findMatchingInstallMethod(this.installMethods, server, location);
      await writeConfig(ctx, installMethod, async (config, configFilepath) => {
        const servers = listServers(config);
        assertNoExistingServer(configFilepath, servers, server);
        const name = generateServerName(servers, server);
        config.mcpServers ??= {};
        config.mcpServers[name] = generateTransport(server, configFilepath, installMethod.location);
      });
      return installMethod;
    },
    async uninstall(ctx, server, location) {
      const installMethod = findMatchingInstallMethod(this.installMethods, server, location);
      await writeConfig(ctx, installMethod, async (config, configFilepath) => {
        const servers = listServers(config);
        const index = findExistingServer(configFilepath, servers, server);
        if (index === -1) {
          throw new ServerNotInstalled(server);
        }

        delete config.mcpServers![servers[index]!.name];
      });
      return installMethod;
    },
  };
}

function listServers(config: Config): readonly InstalledServer[] {
  if (!config.mcpServers) return [];

  const installedServers: InstalledServer[] = [];
  for (const [name, maybeServer] of Object.entries(config.mcpServers)) {
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
