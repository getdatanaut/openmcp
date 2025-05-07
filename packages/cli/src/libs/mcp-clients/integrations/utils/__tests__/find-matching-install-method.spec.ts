import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { InstallMethod } from '../../../types.ts';
import findMatchingInstallMethod from '../find-matching-install-method.ts';

describe('findMatchingInstallMethod', () => {
  const createMethod = (location: 'local' | 'global'): InstallMethod => ({
    type: 'fs',
    filepath: `/path/to/${location}`,
    schema: z.record(z.unknown()),
    location,
  });

  it('should return method with exact location match', () => {
    const methods = [createMethod('global'), createMethod('local')];

    const result = findMatchingInstallMethod(methods, 'local');

    expect(result).toStrictEqual(methods[1]);
  });

  it('should return local method when location is prefer-local', () => {
    const methods = [createMethod('global'), createMethod('local')];

    const result = findMatchingInstallMethod(methods, 'prefer-local');
    expect(result).toStrictEqual(methods[1]);
  });

  it('should fall back to global method when location is prefer-local and no local method exists', () => {
    const methods = [createMethod('global')];

    const result = findMatchingInstallMethod(methods, 'prefer-local');
    expect(result).toStrictEqual(methods[0]);
  });

  it('should return null when no matching method is found for local location', () => {
    const methods = [createMethod('global')];

    expect(findMatchingInstallMethod(methods, 'local')).toBeNull();
  });

  it('should return null when no matching method is found for global location', () => {
    const methods = [createMethod('local')];

    expect(findMatchingInstallMethod(methods, 'global')).toBeNull();
  });

  it('should return null when no methods are provided', () => {
    const methods: InstallMethod[] = [];

    expect(findMatchingInstallMethod(methods, 'prefer-local')).toBeNull();
  });
});
