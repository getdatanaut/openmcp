import * as path from 'node:path';

import type { IFs } from 'memfs';
import { createFsFromVolume, Volume } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { Context, FsInstallMethod } from '../../types.ts';
import readConfig from '../read.ts';

const constants = {
  HOMEDIR: '/home',
  CONFIGDIR: '/home/.config',
} as const;

describe('readConfig', () => {
  const schema = z.object({
    mcpServers: z.record(
      z
        .object({
          type: z.string(),
        })
        .passthrough(),
    ),
  });

  it.concurrent('should successfully read and parse a valid config file', async () => {
    const filename = 'valid-config.json';
    const vol = Volume.fromJSON({
      [path.join(constants.HOMEDIR, filename)]: JSON.stringify({
        mcpServers: {
          server: {
            type: 'stdio',
            command: 'npx',
            args: ['@openmcp/cli', '-y', 'run', '--server', 'server'],
          },
        },
      }),
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({ fs });

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    await expect(readConfig(ctx, installMethod)).resolves.toStrictEqual({
      mcpServers: {
        server: {
          type: 'stdio',
          command: 'npx',
          args: ['@openmcp/cli', '-y', 'run', '--server', 'server'],
        },
      },
    });
  });

  it.concurrent('should throw an error when JSON parsing fails', async () => {
    const fs = createFsFromVolume(Volume.fromJSON({}));
    const ctx = createTestContext({ fs });

    const filename = 'invalid-json.json';
    const homeConfigPath = path.join(constants.HOMEDIR, filename);

    await fs.promises.mkdir(constants.HOMEDIR, { recursive: true });
    await fs.promises.writeFile(homeConfigPath, 'invalid json');

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    await expect(readConfig(ctx, installMethod)).rejects.toThrow('Error parsing config file:');
  });

  it.concurrent('should throw an error when schema validation fails', async () => {
    const filename = 'invalid-schema.json';
    const vol = Volume.fromJSON({
      [path.join(constants.HOMEDIR, filename)]: JSON.stringify({
        mcpServers: [],
      }),
    });
    const fs = createFsFromVolume(vol);
    const ctx = createTestContext({ fs });

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: `$HOME/${filename}`,
      schema,
    };

    await expect(readConfig(ctx, installMethod)).rejects.toThrow('Error validating config file:');
  });

  it.concurrent('should throw an error when file reading fails', async () => {
    const fs = createFsFromVolume(Volume.fromJSON({}));
    const ctx = createTestContext({ fs });

    const installMethod: FsInstallMethod = {
      type: 'fs',
      filepath: '$HOME/non-existent-file.json',
      schema,
    };

    await expect(readConfig(ctx, installMethod)).rejects.toThrow('ENOENT');
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
