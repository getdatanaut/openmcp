import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { InstallMethod, Server } from '../../../types.ts';
import findMatchingInstallMethod from '../find-matching-install-method.ts';

describe('findMatchingInstallMethod', () => {
  const createServer = (name: string): Server => ({
    id: `server-${name}`,
    name,
    target: `/path/to/${name}`,
  });

  const createMethod = (location: 'local' | 'global'): InstallMethod => ({
    type: 'fs',
    filepath: `/path/to/${location}`,
    schema: z.record(z.unknown()),
    location,
  });

  it('should return method with exact location match', () => {
    const server = createServer('test-server');
    const methods = [createMethod('global'), createMethod('local')];

    const result = findMatchingInstallMethod(methods, server, 'local');

    expect(result).toStrictEqual(methods[1]);
  });

  it('should return local method when location is prefer-local', () => {
    const server = createServer('test-server');
    const methods = [createMethod('global'), createMethod('local')];

    const result = findMatchingInstallMethod(methods, server, 'prefer-local');

    expect(result).toStrictEqual(methods[1]);
  });

  it('should fall back to global method when location is prefer-local and no local method exists', () => {
    const server = createServer('test-server');
    const methods = [createMethod('global')];

    const result = findMatchingInstallMethod(methods, server, 'prefer-local');

    expect(result).toStrictEqual(methods[0]);
  });

  it('should throw InstallLocationUnavailable when no matching method is found for local location', () => {
    const server = createServer('test-server');
    const methods = [createMethod('global')];

    expect(() => findMatchingInstallMethod(methods, server, 'local')).toThrow(
      'Install location "local" is not available for server "test-server"',
    );
  });

  it('should throw InstallLocationUnavailable when no matching method is found for global location', () => {
    const server = createServer('test-server');
    const methods = [createMethod('local')];

    expect(() => findMatchingInstallMethod(methods, server, 'global')).toThrow(
      'Install location "global" is not available for server "test-server"',
    );
  });

  it('should throw InstallLocationUnavailable when no methods are provided', () => {
    const server = createServer('test-server');
    const methods: InstallMethod[] = [];

    expect(() => findMatchingInstallMethod(methods, server, 'prefer-local')).toThrow(
      'Install location "local" is not available for server "test-server"',
    );
  });
});
