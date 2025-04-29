import { describe, expect, it } from 'vitest';

import resolveServers from '../resolve-servers.ts';
import { emptyServersArrayFragment } from './fixtures/empty-servers-array-fragment.ts';
import { emptyServersFragment } from './fixtures/empty-servers-fragment.ts';
import { invalidTemplatedServerFragment } from './fixtures/invalid-templated-server-fragment.ts';
import { invalidUrlServerFragment } from './fixtures/invalid-url-server-fragment.ts';
import { mixedServersFragment } from './fixtures/mixed-servers-fragment.ts';
import { multipleVariablesFragment } from './fixtures/multiple-variables-fragment.ts';
import { nonTemplatedServersFragment } from './fixtures/non-templated-servers-fragment.ts';
import { serverWithNameFragment } from './fixtures/server-with-name-fragment.ts';
import { templatedServerWithDefaultFragment } from './fixtures/templated-server-with-default-fragment.ts';
import { templatedServerWithEnumFragment } from './fixtures/templated-server-with-enum-fragment.ts';

describe('resolveServers', () => {
  it('should return an empty array when service has no servers', () => {
    const result = resolveServers(emptyServersFragment);
    expect(result).toStrictEqual([]);
  });

  it('should return an empty array when service has empty servers array', () => {
    const result = resolveServers(emptyServersArrayFragment);
    expect(result).toStrictEqual([]);
  });

  it('should handle non-templated servers', () => {
    const result = resolveServers(nonTemplatedServersFragment);
    expect(result).toStrictEqual([
      { name: 'Production API', value: 'https://api.example.com/v1', valid: true },
      { name: 'Development API', value: 'https://dev-api.example.com/v1', valid: true },
      { name: 'Invalid URL', value: 'invalid-url', valid: false },
    ]);
  });

  it('should handle templated servers with enum values', () => {
    const result = resolveServers(templatedServerWithEnumFragment);
    expect(result).toStrictEqual([{ name: 'API with version', value: 'https://api.example.com/v1', valid: true }]);
  });

  it('should handle templated servers with only default value', () => {
    const result = resolveServers(templatedServerWithDefaultFragment);
    expect(result).toStrictEqual([{ name: 'Versioned API', value: 'https://api.example.com/v1', valid: true }]);
  });

  it('should handle a mix of templated and non-templated servers', () => {
    const result = resolveServers(mixedServersFragment);
    expect(result).toStrictEqual([
      { name: 'Static API', value: 'https://static-api.example.com', valid: true },
      { name: 'Versioned API', value: 'https://api.example.com/v1', valid: true },
    ]);
  });

  it('should use name as fallback when description is not available', () => {
    const result = resolveServers(serverWithNameFragment);
    expect(result).toStrictEqual([{ name: 'Production API', value: 'https://api.example.com/v1', valid: true }]);
  });

  it('should handle servers with invalid URLs', () => {
    const result = resolveServers(invalidUrlServerFragment);
    expect(result).toStrictEqual([{ name: 'Invalid URL', value: 'not a valid url', valid: false }]);
  });

  it('should handle templated servers that resolve to invalid URLs', () => {
    const result = resolveServers(invalidTemplatedServerFragment);
    expect(result).toStrictEqual([
      {
        name: 'API with invalid path',
        value: 'https://api.example.com/not%20a%20valid%20path%20with%20spaces',
        valid: true,
      },
    ]);
  });

  it('should handle servers with multiple templated variables', () => {
    const result = resolveServers(multipleVariablesFragment);
    expect(result).toStrictEqual([
      { name: 'Multi-variable API', value: 'https://dev.api.example.com/v1', valid: true },
    ]);
  });
});
