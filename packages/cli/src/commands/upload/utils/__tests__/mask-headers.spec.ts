import { describe, expect, it } from 'vitest';

import maskHeaders from '../mask-headers.ts';

describe('maskHeaders', () => {
  it('should mask Bearer token in Authorization header', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      authorization: 'Bearer token123',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(vars).toEqual(new Set(['bearerToken']));
  });

  it('should mask Basic Authorization header', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('authorization', 'Basic {{basicAuth}}');
    expect(vars).toEqual(new Set(['basicAuth']));
  });

  it('should mask custom Authorization header', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      authorization: 'dXNlcjpwYXNz',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('authorization', '{{authorization}}');
    expect(vars).toEqual(new Set(['authorization']));
  });

  it('should mask x-api-key header', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      'x-api-key': 'api-key-value',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('x-api-key', '{{apiKey}}');
    expect(vars).toEqual(new Set(['apiKey']));
  });

  it('should mask x-access-token header', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      'x-access-token': 'access-token-value',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('x-access-token', '{{accessToken}}');
    expect(vars).toEqual(new Set(['accessToken']));
  });

  it('should mask multiple authentication headers', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      authorization: 'Bearer token123',
      'x-api-key': 'api-key-value',
      'x-access-token': 'access-token-value',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result).toHaveProperty('x-api-key', '{{apiKey}}');
    expect(result).toHaveProperty('x-access-token', '{{accessToken}}');
    expect(vars).toEqual(new Set(['bearerToken', 'apiKey', 'accessToken']));
  });

  it('should not mask non-authentication headers', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      'content-type': 'application/json',
      'user-agent': 'test-agent',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('content-type', 'application/json');
    expect(result).toHaveProperty('user-agent', 'test-agent');
    expect(vars).toEqual(new Set([]));
  });

  it('should handle empty headers', () => {
    const vars = new Set<string>();
    const headers = new Headers();

    const result = maskHeaders(vars, headers);

    expect(result).toEqual({});
    expect(vars).toEqual(new Set([]));
  });

  it('should handle headers with empty values', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      authorization: '',
      'x-api-key': '',
      'x-access-token': '',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('authorization', '');
    expect(result).toHaveProperty('x-api-key', '');
    expect(result).toHaveProperty('x-access-token', '');
    expect(vars).toEqual(new Set([]));
  });

  it('should preserve non-masked headers', () => {
    const vars = new Set<string>();
    const headers = new Headers({
      authorization: 'Bearer token123',
      'content-type': 'application/json',
      'user-agent': 'test-agent',
    });

    const result = maskHeaders(vars, headers);

    expect(result).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result).toHaveProperty('content-type', 'application/json');
    expect(result).toHaveProperty('user-agent', 'test-agent');
    expect(vars).toEqual(new Set(['bearerToken']));
  });

  it('should preserve a wide variety of non-authentication headers', () => {
    const vars = new Set<string>();
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

    const result = maskHeaders(vars, headers);

    // Verify authentication header is masked
    expect(vars).toEqual(new Set(['bearerToken']));

    expect(result).toStrictEqual({
      ...headersInit,
      authorization: 'Bearer {{bearerToken}}',
    });
  });
});
