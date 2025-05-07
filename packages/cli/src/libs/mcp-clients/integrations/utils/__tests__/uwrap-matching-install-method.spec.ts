import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { InstallMethod, Server } from '../../../types.ts';
import unwrapMatchingInstallMethod from '../uwrap-matching-install-method.ts';

describe('unwrapMatchingInstallMethod', () => {
  const createMethod = (location: 'local' | 'global'): InstallMethod => ({
    type: 'fs',
    filepath: `/path/to/${location}`,
    schema: z.record(z.unknown()),
    location,
  });

  const server: Server = {
    id: 'test-server-id',
    name: 'test-server',
    target: 'test-target',
  };

  it('should return method with exact location match', () => {
    const methods = [createMethod('global'), createMethod('local')];

    const result = unwrapMatchingInstallMethod(methods, server, 'local');
    expect(result).toStrictEqual(methods[1]);
  });

  it('should return local method when location is prefer-local', () => {
    const methods = [createMethod('global'), createMethod('local')];

    const result = unwrapMatchingInstallMethod(methods, server, 'prefer-local');
    expect(result).toStrictEqual(methods[1]);
  });

  it('should fall back to global method when location is prefer-local and no local method exists', () => {
    const methods = [createMethod('global')];

    const result = unwrapMatchingInstallMethod(methods, server, 'prefer-local');

    expect(result).toStrictEqual(methods[0]);
  });

  it('should throw InstallLocationUnavailable when no matching method is found for local location', () => {
    const methods = [createMethod('global')];

    expect(() => unwrapMatchingInstallMethod(methods, server, 'local')).toThrow(
      'Install location "local" is not available for server "test-server"',
    );
  });

  it('should throw InstallLocationUnavailable when no matching method is found for global location', () => {
    const methods = [createMethod('local')];

    expect(() => unwrapMatchingInstallMethod(methods, server, 'global')).toThrow(
      'Install location "global" is not available for server "test-server"',
    );
  });

  it('should throw InstallLocationUnavailable when no methods are provided', () => {
    const methods: InstallMethod[] = [];

    expect(() => unwrapMatchingInstallMethod(methods, server, 'prefer-local')).toThrow(
      'Install location "local" is not available for server "test-server"',
    );
  });
});
