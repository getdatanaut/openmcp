import { describe, expect, it } from 'vitest';

import findRemix from '../find-remix.ts';

describe('findRemix', () => {
  it('should return true when transport contains matching remixId', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', '--server', 'test-remix-id'],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(true);
  });

  it('should return false when transport contains different remixId', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', '--server', 'different-remix-id'],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport does not contain --server argument', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', 'run', 'test-remix-id'],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport does not contain @openmcp/cli', () => {
    const transport = {
      command: 'npx',
      args: ['some-other-package', 'run', '--server', 'test-remix-id'],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport has less than 4 arguments', () => {
    const transport = {
      command: 'npx',
      args: ['@openmcp/cli', '--server'],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport is not valid', () => {
    const transport = {
      command: 'not-npx',
      args: ['@openmcp/cli', 'run', '--server', 'test-remix-id'],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport is null', () => {
    expect(findRemix(null, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport is undefined', () => {
    expect(findRemix(undefined, 'test-remix-id')).toBe(false);
  });

  it('should return false when transport.args is not an array', () => {
    const transport = {
      command: 'npx',
      args: 'not-an-array',
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(false);
  });

  it('should handle complex argument patterns correctly', () => {
    const transport = {
      command: 'npx',
      args: [
        'some-arg',
        '@openmcp/cli@1.0.0',
        'another-arg',
        '--server',
        'test-remix-id',
        '--extra-flag',
      ],
    };

    expect(findRemix(transport, 'test-remix-id')).toBe(true);
  });
});
