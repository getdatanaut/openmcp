import { describe, expect, it } from 'vitest';

import type { InstallMethodLocation, Server } from '../../../types.ts';
import generateTransport from '../generate-transport.ts';

describe('generateTransport', () => {
  it.concurrent('should generate transport with --server flag when target starts with ag_', () => {
    const server: Server = {
      id: 'ag_abc1234de',
      name: 'Test Server',
      target: 'ag_abc1234de',
    };
    const configFilepath = '/path/to/config.json';
    const location: InstallMethodLocation = 'global';

    const transport = generateTransport(server, configFilepath, location);

    expect(transport).toStrictEqual({
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--server', 'ag_abc1234de'],
    });
  });

  it.concurrent('should generate transport with --config flag when target does not start with ag_ and location is global', () => {
    const server: Server = {
      id: 'test-server-id',
      name: 'Test Server',
      target: '/path/to/config.json',
    };
    const configFilepath = '/path/to/config.json';
    const location: InstallMethodLocation = 'global';

    const transport = generateTransport(server, configFilepath, location);

    expect(transport).toStrictEqual({
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--config', '/path/to/config.json'],
    });
  });

  it.concurrent('should generate transport with relative --config path when location is local', () => {
    const server: Server = {
      id: 'test-server-id',
      name: 'Test Server',
      target: '/path/to/config.json',
    };
    const configFilepath = '/path/to/mcp/config.json';
    const location: InstallMethodLocation = 'local';

    const transport = generateTransport(server, configFilepath, location);

    expect(transport).toStrictEqual({
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--config', '../config.json'],
    });
  });
});
