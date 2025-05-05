import type { IFs } from 'memfs';
import { createFsFromVolume, Volume } from 'memfs';
import { describe, expect, it } from 'vitest';

import { ServerNotInstalled } from '../../errors/index.ts';
import type { Context, Server } from '../../types.ts';
import createGooseClient from '../goose.ts';
import { configYaml, emptyConfigYaml, invalidConfigYaml } from './fixtures/goose.ts';

describe('createGooseClient', () => {
  it.concurrent('should correctly install for global location', async () => {
    const vol = Volume.fromJSON({});
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({
      fs,
      constants: {
        HOMEDIR: '/home',
        CONFIGDIR: '/home/.config',
        CWD: '/home/project',
      },
    });

    const client = createGooseClient();

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.install(ctx, server, 'global')).resolves.toBe(client.installMethods[0]);
    await expect(fs.promises.readFile('/home/.config/goose/config.yaml', 'utf8')).resolves.toBe(configYaml);
  });

  it.concurrent('should throw when trying to install a server that already exists', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/goose/config.yaml': configYaml,
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({
      fs,
      constants: {
        HOMEDIR: '/home',
        CONFIGDIR: '/home/.config',
        CWD: '/home/project',
      },
    });

    const client = createGooseClient();

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.install(ctx, server, 'global')).rejects.toThrow();
  });

  it.concurrent('should correctly uninstall for global location', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/goose/config.yaml': configYaml,
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({
      fs,
      constants: {
        HOMEDIR: '/home',
        CONFIGDIR: '/home/.config',
        CWD: '/home/project',
      },
    });

    const client = createGooseClient();

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.uninstall(ctx, server, 'global')).resolves.toBe(client.installMethods[0]);
    await expect(fs.promises.readFile('/home/.config/goose/config.yaml', 'utf8')).resolves.toBe(emptyConfigYaml);
  });

  it.concurrent('should throw ServerNotInstalled when trying to uninstall a server that does not exist', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/goose/config.yaml': emptyConfigYaml,
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({
      fs,
      constants: {
        HOMEDIR: '/home',
        CONFIGDIR: '/home/.config',
        CWD: '/home/project',
      },
    });

    const client = createGooseClient();

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.uninstall(ctx, server, 'global')).rejects.toThrow(ServerNotInstalled);
  });

  it.concurrent('should correctly handle invalid server entries in the config', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/goose/config.yaml': invalidConfigYaml,
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({
      fs,
      constants: {
        HOMEDIR: '/home',
        CONFIGDIR: '/home/.config',
        CWD: '/home/project',
      },
    });

    const client = createGooseClient();

    const server: Server = {
      id: 'ag_xyz789',
      name: 'Valid Server',
      target: 'ag_xyz789',
    };

    // Should be able to uninstall the valid server
    await expect(client.uninstall(ctx, server, 'global')).resolves.toBe(client.installMethods[0]);
  });
});

// Helper function to create a test context
function createTestContext({ fs, constants }: { fs: IFs; constants: Context['constants'] }): Context {
  return {
    platform: 'linux',
    constants,
    logger: {
      start: () => {},
      success: () => {},
      verbose: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    fs: {
      readFile: fs.promises.readFile,
      writeFile: fs.promises.writeFile,
      mkdir: fs.promises.mkdir,
    } as Context['fs'],
  };
}
