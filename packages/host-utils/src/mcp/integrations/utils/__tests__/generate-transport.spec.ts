import { describe, expect, it } from 'vitest';

import generateTransport from '../generate-transport.ts';
import type { Remix } from '../../../types.ts';

describe('generateTransport', () => {
  it('should generate transport with --server flag when no filepath is provided', () => {
    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    const transport = generateTransport(remix);

    expect(transport).toEqual({
      command: 'npx',
      args: ['-y', '@openmcp/cli@latest', 'run', '--server', 'test-remix-id'],
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
      args: ['-y', '@openmcp/cli@latest', 'run', '--config', '/path/to/config.json'],
    });
  });
});
