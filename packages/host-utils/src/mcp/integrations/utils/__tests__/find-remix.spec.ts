import { describe, expect, it } from 'vitest';

import type { Remix } from '../../../types.ts';
import findRemix from '../find-remix.ts';

describe('findRemix', () => {
  it('should return true when transport contains matching remix id with --server flag', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', '--server', 'test-remix-id'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(true);
  });

  it('should return false when transport contains different remix id with --server flag', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', '--server', 'different-remix-id'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should return true when transport contains matching filepath with --config flag', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', '--config', '/path/to/config.json'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
      filepath: '/path/to/config.json',
    };

    expect(findRemix(transport, remix)).toBe(true);
  });

  it('should return false when transport contains different filepath with --config flag', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', '--config', '/different/path.json'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
      filepath: '/path/to/config.json',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should return false when transport does not contain --server or --config argument', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', 'test-remix-id'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should return false when transport does not contain @openmcp/cli', () => {
    const transport = {
      command: 'npx',
      args: ['some-other-package', 'run', '--server', 'test-remix-id'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should return false when transport has less than 4 arguments', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', '--server'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should return false when transport is not valid', () => {
    const transport = {
      command: 'not-npx',
      args: ['@openmcp/cli', 'run', '--server', 'test-remix-id'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should return false when transport is null', () => {
    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(null, remix)).toBe(false);
  });

  it('should return false when transport is undefined', () => {
    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(undefined, remix)).toBe(false);
  });

  it('should return false when transport.args is not an array', () => {
    const transport = {
      command: 'npx',
      args: 'not-an-array',
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(false);
  });

  it('should handle complex argument patterns correctly with --server flag', () => {
    const transport = {
      command: 'npx',
      args: ['some-arg', '@openmcp/cli@1.0.0', 'another-arg', '--server', 'test-remix-id', '--extra-flag'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(findRemix(transport, remix)).toBe(true);
  });

  it('should handle complex argument patterns correctly with --config flag', () => {
    const transport = {
      command: 'npx',
      args: ['some-arg', '@openmcp/cli@1.0.0', 'another-arg', '--config', '/path/to/config.json', '--extra-flag'],
    };

    const remix: Remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
      filepath: '/path/to/config.json',
    };

    expect(findRemix(transport, remix)).toBe(true);
  });
});
