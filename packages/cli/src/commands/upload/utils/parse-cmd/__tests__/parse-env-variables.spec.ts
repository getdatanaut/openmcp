import { describe, expect, it } from 'vitest';

import parseEnvVariables from '../parse-env-variables.ts';

describe('parseEnvVariables', () => {
  it('should parse a single environment variable with a simple value', () => {
    const input = 'MY_VAR=value';
    const result = parseEnvVariables(input);
    expect(result).toEqual({
      vars: [['MY_VAR', 'value']],
      lastIndex: input.length,
    });
  });

  it('should parse multiple environment variables', () => {
    const input = 'VAR1=value1 VAR2=value2';
    const result = parseEnvVariables(input);
    expect(result).toEqual({
      vars: [
        ['VAR1', 'value1'],
        ['VAR2', 'value2'],
      ],
      lastIndex: input.length,
    });
  });

  it('should handle empty values', () => {
    const input = 'MY_VAR= VAR2=value2';
    const result = parseEnvVariables(input);
    expect(result).toEqual({
      vars: [
        ['MY_VAR', ''],
        ['VAR2', 'value2'],
      ],
      lastIndex: input.length,
    });
  });

  it('should handle quoted values correctly', () => {
    const input = 'MY_VAR="quoted value"';
    const result = parseEnvVariables(input);
    expect(result).toEqual({
      vars: [['MY_VAR', 'quoted value']],
      lastIndex: input.length,
    });
  });

  it('should throw an error for unmatched quotes', () => {
    const input = 'MY_VAR="unmatched';
    expect(() => parseEnvVariables(input)).toThrow('Unmatched quote at index 17');
  });

  it('should ignore invalid environment variable names', () => {
    const input = '1INVALID=value VALID_VAR=value2';
    const result = parseEnvVariables(input);
    expect(result).toEqual({
      vars: [],
      lastIndex: 0,
    });
  });

  it('should handle empty input gracefully', () => {
    const input = '';
    const result = parseEnvVariables(input);
    expect(result).toEqual({
      vars: [],
      lastIndex: 0,
    });
  });
});
