import type { IFs } from 'memfs';
import { createFsFromVolume, Volume } from 'memfs';
import { describe, expect, it } from 'vitest';

import { ServerNotInstalled } from '../../errors/index.ts';
import type { Context, Server } from '../../types.ts';
import createGenericClient from '../generic.ts';
import { configYaml, emptyConfigYaml, invalidConfigYaml } from './fixtures/generic.ts';

describe('createGenericClient', () => {
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: null,
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.install(ctx, server, 'global')).resolves.toBe(client.installMethods[0]);
    await expect(fs.promises.readFile('/home/.config/test-client/config.yaml', 'utf8')).resolves.toBe(configYaml);
  });

  it.concurrent('should correctly install for local location', async () => {
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

    const client = createGenericClient('test-client', {
      global: null,
      local: '/home/project/.test-client/config.yaml',
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.install(ctx, server, 'local')).resolves.toBe(client.installMethods[0]);
    await expect(fs.promises.readFile('/home/project/.test-client/config.yaml', 'utf8')).resolves.toBe(configYaml);
  });

  it.concurrent('should throw when trying to install a server that already exists', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/test-client/config.yaml': configYaml,
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: null,
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.install(ctx, server, 'global')).rejects.toThrow();
  });

  it.concurrent('should correctly uninstall for global location', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/test-client/config.yaml': configYaml,
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: null,
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.uninstall(ctx, server, 'global')).resolves.toBe(client.installMethods[0]);
    await expect(fs.promises.readFile('/home/.config/test-client/config.yaml', 'utf8')).resolves.toBe(emptyConfigYaml);
  });

  it.concurrent('should throw ServerNotInstalled when trying to uninstall a server that does not exist', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/test-client/config.yaml': emptyConfigYaml,
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: null,
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.uninstall(ctx, server, 'global')).rejects.toThrow(ServerNotInstalled);
  });

  it.concurrent('should correctly handle invalid server entries in the config', async () => {
    const vol = Volume.fromJSON({
      '/home/.config/test-client/config.yaml': invalidConfigYaml,
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: null,
    });

    const server: Server = {
      id: 'ag_xyz789',
      name: 'Valid Server',
      target: 'ag_xyz789',
    };

    // Should be able to uninstall the valid server
    await expect(client.uninstall(ctx, server, 'global')).resolves.toBe(client.installMethods[0]);
  });

  it.concurrent('should prefer local installation when both local and global are available', async () => {
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: '/home/project/.test-client/config.yaml',
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    // Should use the local installation method (index 1)
    await expect(client.install(ctx, server, 'prefer-local')).resolves.toBe(client.installMethods[1]);
    // Should write to the local config file
    await expect(fs.promises.readFile('/home/project/.test-client/config.yaml', 'utf8')).resolves.toBe(configYaml);
    // Should not write to the global config file
    await expect(fs.promises.readFile('/home/.config/test-client/config.yaml', 'utf8')).rejects.toThrow();
  });

  it.concurrent('should fall back to global installation when local is not available', async () => {
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

    const client = createGenericClient('test-client', {
      global: '/home/.config/test-client/config.yaml',
      local: null,
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    // Should use the local installation method (index 0)
    await expect(client.install(ctx, server, 'prefer-local')).resolves.toBe(client.installMethods[0]);
    // Should write to the global config file
    await expect(fs.promises.readFile('/home/.config/test-client/config.yaml', 'utf8')).resolves.toBe(configYaml);
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
