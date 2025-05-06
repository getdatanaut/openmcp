import { describe, expect, it } from 'vitest';

import strictReplaceVariables from '../strict-replace-variables.ts';

describe('strictReplaceVariables', () => {
  it('should replace variables when all are provided', () => {
    const input = 'Hello, {{name}}!';
    const values = { name: 'World' };
    const result = strictReplaceVariables(input, values);
    expect(result).toBe('Hello, World!');
  });

  it('should throw an error when a variable is missing', () => {
    const input = 'Hello, {{name}}!';
    const values = {};
    expect(() => strictReplaceVariables(input, values)).toThrow('Missing variable: name');
  });

  it('should handle inputs with no variables', () => {
    const input = 'Hello, World!';
    const values = { name: 'Unused' };
    const result = strictReplaceVariables(input, values);
    expect(result).toBe('Hello, World!');
  });

  it('should ignore non-object values for the variables parameter', () => {
    const input = 'Hello, {{name}}!';
    const values = null;
    expect(() => strictReplaceVariables(input, values)).toThrow('Missing variable: name');
  });
});
