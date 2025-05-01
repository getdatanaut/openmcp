import * as path from 'node:path';

import type { IFs } from 'memfs';
import { createFsFromVolume, Volume } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { Context, FsInstallMethod } from '../../types.ts';
import writeConfig from '../write.ts';

const constants = {
  HOMEDIR: '/home',
  CONFIGDIR: '/home/.config',
} as const;

describe('writeConfig', () => {
  const schema = z.object({
    mcpServers: z
      .record(
        z
          .object({
            type: z.string(),
          })
          .passthrough(),
      )
      .optional(),
  });

  it.concurrent('should successfully write a config file when it exists', async () => {
    const filename = 'existing-config.json';
    const initialConfig = {
      mcpServers: {
        server: {
          type: 'stdio',
          command: 'npx',
          args: ['openmcp', '-y', 'run', '--server', 'server'],
        },
      },
    };

    const vol = Volume.fromJSON({
      [path.join(constants.HOMEDIR, filename)]: JSON.stringify(initialConfig),
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({ fs });

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    const applyConfig = vi.fn().mockImplementation(async config => {
      config.mcpServers.newServer = {
        type: 'http',
        url: 'http://localhost:3000',
      };
    });

    await writeConfig(ctx, installMethod, applyConfig);

    const fileContent = String(await fs.promises.readFile(path.join(constants.HOMEDIR, filename), 'utf8'));
    const writtenConfig = JSON.parse(fileContent);

    expect(writtenConfig).toStrictEqual({
      mcpServers: {
        server: {
          type: 'stdio',
          command: 'npx',
          args: ['openmcp', '-y', 'run', '--server', 'server'],
        },
        newServer: {
          type: 'http',
          url: 'http://localhost:3000',
        },
      },
    });
  });

  it.concurrent('should create a new config file when it does not exist', async () => {
    const filename = 'non-existent-config.json';
    const vol = Volume.fromJSON({});
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({ fs });

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    const applyConfig = vi.fn().mockImplementation(async config => {
      config.mcpServers = {
        server: {
          type: 'stdio',
          command: 'npx',
          args: ['openmcp@latest', '-y', 'run', '--server', 'server'],
        },
      };
    });

    await writeConfig(ctx, installMethod, applyConfig);

    // Verify that the directory was created
    const dirExists = await fs.promises
      .stat(constants.HOMEDIR)
      .then(s => s.isDirectory())
      .catch(() => false);
    expect(dirExists).not.toBe(false);

    const fileContent = String(await fs.promises.readFile(path.join(constants.HOMEDIR, filename), 'utf8'));
    const writtenConfig = JSON.parse(fileContent);

    expect(writtenConfig).toStrictEqual({
      mcpServers: {
        server: {
          type: 'stdio',
          command: 'npx',
          args: ['openmcp@latest', '-y', 'run', '--server', 'server'],
        },
      },
    });
  });

  it.concurrent('should rethrow errors that are not ENOENT', async () => {
    const filename = 'error-config.json';
    const vol = Volume.fromJSON({});
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({ fs });

    // Mock the readFile method to throw a non-ENOENT error
    vi.spyOn(ctx.fs, 'readFile').mockRejectedValue(new Error('Some other error'));

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    const applyConfig = vi.fn();

    await expect(writeConfig(ctx, installMethod, applyConfig)).rejects.toThrow('Some other error');
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it.concurrent('should handle errors from applyConfig', async () => {
    const filename = 'apply-error-config.json';
    const vol = Volume.fromJSON({
      [path.join(constants.HOMEDIR, filename)]: JSON.stringify({}),
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({ fs });

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    const applyConfig = vi.fn().mockRejectedValue(new Error('Apply config error'));

    await expect(writeConfig(ctx, installMethod, applyConfig)).rejects.toThrow('Apply config error');
  });
});

function createTestContext({ fs }: { fs: IFs }): Context {
  return {
    platform: 'linux',
    constants,
    logger: {
      start: vi.fn(),
      success: vi.fn(),
      verbose: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    fs: {
      readFile: fs.promises.readFile,
      writeFile: fs.promises.writeFile,
      mkdir: fs.promises.mkdir,
    } as Context['fs'],
  };
}
