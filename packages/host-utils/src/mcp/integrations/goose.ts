import { z } from 'zod';

import { writeConfig } from '../config/index.ts';
import type { FsInstallMethod, McpHostClient, Remix } from '../types.ts';
import addRemix from './utils/add-remix.ts';
import deleteRemix from './utils/delete-remix.ts';
import generateTransport from './utils/generate-transport.ts';

const CONFIG_SCHEMA = z
  .object({
    extensions: z.record(z.unknown()).optional(),
  })
  .passthrough();

type Config = z.infer<typeof CONFIG_SCHEMA>;

type VSCodeClient = McpHostClient<FsInstallMethod<Config>>;

export default function createGooseClient(): VSCodeClient {
  return {
    name: 'goose',
    installMethod: {
      type: 'fs',
      filepath: '$HOME/.config/goose/config.yaml',
      schema: CONFIG_SCHEMA,
    },
    install(ctx, remix) {
      return writeConfig(ctx, this.installMethod, async config => {
        addRemix((config.extensions ??= {}), remix, generateGooseTransport(remix));
      });
    },
    uninstall(ctx, remix) {
      return writeConfig(ctx, this.installMethod, async config => {
        deleteRemix(config.extensions, remix);
      });
    },
  };
}

function generateGooseTransport(remix: Remix) {
  const { args, command } = generateTransport(remix);
  return {
    args,
    bundled: null,
    cmd: command,
    description: null,
    enabled: true,
    env_keys: [],
    envs: {},
    name: remix.name,
    timeout: 300,
    type: 'stdio',
  };
}
