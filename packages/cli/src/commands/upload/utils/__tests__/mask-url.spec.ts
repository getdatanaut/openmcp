import { describe, expect, it } from 'vitest';

import ConfigSchema from '../config-schema.ts';
import maskUrl from '../mask-url.ts';

describe('maskUrl', () => {
  it('should mask username and password in URL', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://user:pass@example.com');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://{{username}}:{{password}}@example.com');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['username', 'password'],
    });
  });

  it('should mask only username when password is not present', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://user@example.com');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://{{username}}@example.com');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        username: { type: 'string' },
      },
      required: ['username'],
    });
  });

  it('should mask authentication query parameters', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://example.com/api?token=secret123&other=value');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://example.com/api?token={{token}}&other=value');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
      required: ['token'],
    });
  });

  it('should mask multiple authentication query parameters', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://example.com/api?token=secret123&access_token=abc&api_key=xyz');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://example.com/api?token={{token}}&access_token={{access_token}}&api_key={{api_key}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        token: { type: 'string' },
        access_token: { type: 'string' },
        api_key: { type: 'string' },
      },
      required: ['token', 'access_token', 'api_key'],
    });
  });

  it('should not mask non-authentication query parameters', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://example.com/api?param1=value1&param2=value2');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://example.com/api?param1=value1&param2=value2');
    expect(configSchema.serialize()).toBeUndefined();
  });

  it('should handle URLs without query parameters', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://example.com/path');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://example.com/path');
    expect(configSchema.serialize()).toBeUndefined();
  });

  it('should handle URLs with empty authentication parameter values', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://example.com/api?token=&param=value');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://example.com/api?token=&param=value');
    expect(configSchema.serialize()).toBeUndefined();
  });

  it('should handle URLs with both credentials and auth query parameters', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://user:pass@example.com/api?token=secret&param=value');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://{{username}}:{{password}}@example.com/api?token={{token}}&param=value');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        token: { type: 'string' },
      },
      required: ['username', 'password', 'token'],
    });
  });

  it('should not add trailing ampersand to query string', () => {
    const configSchema = new ConfigSchema();
    const url = new URL('https://example.com/api?param=value');

    const result = maskUrl(configSchema, url);

    expect(result).toBe('https://example.com/api?param=value');
    expect(configSchema.serialize()).toBeUndefined();
  });
});
