import { describe, expect, it } from 'vitest';

import applyUrlVariables from '../apply-url-variables.ts';

describe('applyUrlVariables', () => {
  it('should substitute a single variable with a single value', () => {
    const url = 'https://api.example.com/{version}/users';
    const variables = [['version', ['v1']]] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual(['https://api.example.com/v1/users']);
  });

  it('should substitute a single variable with multiple values', () => {
    const url = 'https://api.example.com/{version}/users';
    const variables = [['version', ['v1', 'v2']]] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual(['https://api.example.com/v1/users', 'https://api.example.com/v2/users']);
  });

  it('should substitute multiple variables with single values', () => {
    const url = 'https://api.example.com/{version}/users/{userId}';
    const variables = [
      ['version', ['v1']],
      ['userId', ['123']],
    ] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual(['https://api.example.com/v1/users/123']);
  });

  it('should substitute multiple variables with multiple values', () => {
    const url = 'https://api.example.com/{version}/users/{userId}';
    const variables = [
      ['version', ['v1', 'v2']],
      ['userId', ['123', '456']],
    ] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual([
      'https://api.example.com/v1/users/123',
      'https://api.example.com/v1/users/456',
      'https://api.example.com/v2/users/123',
      'https://api.example.com/v2/users/456',
    ]);
  });

  it('should handle variables with special characters', () => {
    const url = 'https://api.example.com/{path}/items';
    const variables = [['path', ['special/path', 'path with spaces']]] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual([
      'https://api.example.com/special/path/items',
      'https://api.example.com/path%20with%20spaces/items',
    ]);
  });

  it('should handle variables with empty values', () => {
    const url = 'https://api.example.com/{version}/users';
    const variables = [['version', ['']]] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual(['https://api.example.com//users']);
  });

  it('should handle multiple occurrences of the same variable', () => {
    const url = 'https://api.example.com/{version}/users/{version}/details';
    const variables = [['version', ['v1', 'v2']]] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual([
      'https://api.example.com/v1/users/v1/details',
      'https://api.example.com/v2/users/v2/details',
    ]);
  });

  it('should handle URLs with no variables', () => {
    const url = 'https://api.example.com/v1/users';
    const variables: readonly [string, readonly string[]][] = [];

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual(['https://api.example.com/v1/users']);
  });

  it('should handle empty URL', () => {
    const url = '';
    const variables = [['version', ['v1']]] as const;

    const result = applyUrlVariables(url, variables);
    expect(result).toStrictEqual(['']);
  });
});
