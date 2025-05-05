import type { IFs } from 'memfs';
import { createFsFromVolume, Volume } from 'memfs';
import { describe, expect, it } from 'vitest';

import type { Context, Server } from '../../types.ts';
import createVSCodeClient from '../vscode.ts';
import { emptyMcpJson, emptySettingsJson, mcpJson, settingsJson } from './fixtures/vscode.ts';

describe('createVSCodeClient', () => {
  it.concurrent.each([
    ['global', 0, '/home/.config/Code/User/settings.json', { after: settingsJson }],
    ['local', 1, '/home/project/.vscode/mcp.json', { after: mcpJson }],
    ['prefer-local', 1, '/home/project/.vscode/mcp.json', { after: mcpJson }],
  ] as const)('should correctly install for $0 location', async (location, index, path, { after }) => {
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

    const client = createVSCodeClient('vscode', {
      global: '$CONFIG/Code/User/settings.json',
      local: '$CWD/.vscode/mcp.json',
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.install(ctx, server, location)).resolves.toBe(client.installMethods[index]);
    await expect(fs.promises.readFile(path, 'utf8')).resolves.toBe(after);
  });

  it.concurrent.each([
    [
      'global',
      0,
      '/home/.config/Code - Insiders/User/settings.json',
      { before: settingsJson, after: emptySettingsJson },
    ],
    ['local', 1, '/home/project/.vscode/mcp.json', { before: mcpJson, after: emptyMcpJson }],
    ['prefer-local', 1, '/home/project/.vscode/mcp.json', { before: mcpJson, after: emptyMcpJson }],
  ] as const)('should correct uninstall for $0 location', async (location, index, path, { before, after }) => {
    const vol = Volume.fromJSON({
      [path]: before,
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

    const client = createVSCodeClient('vscode-insiders', {
      global: '$CONFIG/Code - Insiders/User/settings.json',
      local: '$CWD/.vscode/mcp.json',
    });

    const server: Server = {
      id: 'ag_abc123de',
      name: 'Test Server',
      target: 'ag_abc123de',
    };

    await expect(client.uninstall(ctx, server, location)).resolves.toBe(client.installMethods[index]);
    await expect(fs.promises.readFile(path, 'utf8')).resolves.toBe(after);
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
