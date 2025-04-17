import { describe, expect, it } from 'vitest';

import ConfigSchema from '../config-schema.ts';
import maskHeaders from '../mask-headers.ts';

describe('maskHeaders', () => {
  it('should mask Bearer token in Authorization header', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      authorization: 'Bearer token123',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        bearerToken: { type: 'string' },
      },
      required: ['bearerToken'],
    });
  });

  it('should mask Basic Authorization header', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('authorization', 'Basic {{basicAuth}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        basicAuth: { type: 'string' },
      },
      required: ['basicAuth'],
    });
  });

  it('should mask custom Authorization header', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      authorization: 'dXNlcjpwYXNz',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('authorization', '{{authorization}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        authorization: { type: 'string' },
      },
      required: ['authorization'],
    });
  });

  it('should mask x-api-key header', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      'x-api-key': 'api-key-value',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('x-api-key', '{{apiKey}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
      },
      required: ['apiKey'],
    });
  });

  it('should mask x-access-token header', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      'x-access-token': 'access-token-value',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('x-access-token', '{{accessToken}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
      required: ['accessToken'],
    });
  });

  it('should mask multiple authentication headers', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      authorization: 'Bearer token123',
      'x-api-key': 'api-key-value',
      'x-access-token': 'access-token-value',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result).toHaveProperty('x-api-key', '{{apiKey}}');
    expect(result).toHaveProperty('x-access-token', '{{accessToken}}');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        bearerToken: { type: 'string' },
        apiKey: { type: 'string' },
        accessToken: { type: 'string' },
      },
      required: ['bearerToken', 'apiKey', 'accessToken'],
    });
  });

  it('should not mask non-authentication headers', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      'content-type': 'application/json',
      'user-agent': 'test-agent',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('content-type', 'application/json');
    expect(result).toHaveProperty('user-agent', 'test-agent');
    expect(configSchema.serialize()).toBeUndefined();
  });

  it('should handle empty headers', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers();

    const result = maskHeaders(configSchema, headers);

    expect(result).toStrictEqual({});
    expect(configSchema.serialize()).toBeUndefined();
  });

  it('should handle headers with empty values', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      authorization: '',
      'x-api-key': '',
      'x-access-token': '',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('authorization', '');
    expect(result).toHaveProperty('x-api-key', '');
    expect(result).toHaveProperty('x-access-token', '');
    expect(configSchema.serialize()).toBeUndefined();
  });

  it('should preserve non-masked headers', () => {
    const configSchema = new ConfigSchema();
    const headers = new Headers({
      authorization: 'Bearer token123',
      'content-type': 'application/json',
      'user-agent': 'test-agent',
    });

    const result = maskHeaders(configSchema, headers);

    expect(result).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result).toHaveProperty('content-type', 'application/json');
    expect(result).toHaveProperty('user-agent', 'test-agent');
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        bearerToken: { type: 'string' },
      },
      required: ['bearerToken'],
    });
  });

  it('should preserve a wide variety of non-authentication headers', () => {
    const configSchema = new ConfigSchema();
    const headersInit = {
      authorization: 'Bearer token123',
      'content-type': 'application/json',
      'content-length': '256',
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      host: 'api.example.com',
      origin: 'https://example.com',
      pragma: 'no-cache',
      referer: 'https://example.com/page',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'custom-header': 'custom-value',
    };

    const headers = new Headers(headersInit);

    const result = maskHeaders(configSchema, headers);

    // Verify authentication header is masked
    expect(configSchema.serialize()).toStrictEqual({
      type: 'object',
      properties: {
        bearerToken: { type: 'string' },
      },
      required: ['bearerToken'],
    });

    expect(result).toStrictEqual({
      ...headersInit,
      authorization: 'Bearer {{bearerToken}}',
    });
  });
});
