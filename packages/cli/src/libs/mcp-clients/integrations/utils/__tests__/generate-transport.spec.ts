import { describe, expect, it } from 'vitest';

import type { Server } from '../../../types.ts';
import generateTransport from '../generate-transport.ts';

describe('generateTransport', () => {
  it('should generate transport with --server flag when target starts with ag_', () => {
    const server: Server = {
      id: 'ag_abc1234de',
      name: 'Test Server',
      target: 'ag_abc1234de',
    };

    const transport = generateTransport(server);

    expect(transport).toEqual({
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--server', 'ag_abc1234de'],
    });
  });

  it('should generate transport with --config flag when target does not start with ag_', () => {
    const server: Server = {
      id: 'test-server-id',
      name: 'Test Server',
      target: '/path/to/config.json',
    };

    const transport = generateTransport(server);

    expect(transport).toEqual({
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--config', '/path/to/config.json'],
    });
  });
});
