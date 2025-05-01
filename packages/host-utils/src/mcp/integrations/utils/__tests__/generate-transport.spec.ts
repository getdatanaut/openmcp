import { describe, expect, it } from 'vitest';

import type { Remix } from '../../../types.ts';
import generateTransport from '../generate-transport.ts';

describe('generateTransport', () => {
  it('should generate transport with --server flag when no filepath is provided', () => {
    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    const transport = generateTransport(remix);

    expect(transport).toEqual({
      command: 'npx',
      args: ['@openmcp/cli@latest', 'run', '--server', 'test-remix-id'],
    });
  });

  it('should generate transport with --config flag when filepath is provided', () => {
    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
      filepath: '/path/to/config.json',
    };

    const transport = generateTransport(remix);

    expect(transport).toEqual({
      command: 'npx',
      args: ['@openmcp/cli@latest', 'run', '--config', '/path/to/config.json'],
    });
  });
});
