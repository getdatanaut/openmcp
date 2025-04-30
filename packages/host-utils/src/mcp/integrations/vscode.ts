import { z } from 'zod';

import { type ResolvableConfigPath, writeConfig } from '../config/index.ts';
import type { FsInstallMethod, McpHostClient } from '../types.ts';
import addRemix from './utils/add-remix.ts';
import deleteRemix from './utils/delete-remix.ts';
import generateTransport from './utils/generate-transport.ts';

const CONFIG_SCHEMA = z
  .object({
    mcp: z
      .object({
        servers: z.record(z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

type Config = z.infer<typeof CONFIG_SCHEMA>;

type VSCodeClient = McpHostClient<FsInstallMethod<Config>>;

export default function createVSCodeClient(
  name: 'vscode' | 'vscode-insiders',
  filepath: ResolvableConfigPath,
): VSCodeClient {
  return {
    name,
    installMethod: {
      type: 'fs',
      filepath,
      schema: CONFIG_SCHEMA,
    },
    install(ctx, remix) {
      return writeConfig(ctx, this.installMethod, async config => {
        addRemix(((config.mcp ??= {}).servers ??= {}), remix, {
          type: 'stdio',
          ...generateTransport(remix),
        });
      });
    },
    uninstall(ctx, remix) {
      return writeConfig(ctx, this.installMethod, async config => {
        deleteRemix(config.mcp?.servers, remix);
      });
    },
  };
}
