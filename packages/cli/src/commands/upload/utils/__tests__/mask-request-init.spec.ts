import { describe, expect, it } from 'vitest';

import maskRequestInit from '../mask-request-init.ts';

describe('maskRequestInit', () => {
  it('should mask headers in RequestInit object', () => {
    const vars = new Set<string>();
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token123',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ data: 'test' })
    };

    const result = maskRequestInit(vars, requestInit);

    // Check that headers were masked
    expect(result.headers).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result.headers).toHaveProperty('content-type', 'application/json');
    expect(vars).toEqual(new Set(['bearerToken']));

    // Check that other properties were preserved
    expect(result.method).toBe('POST');
    expect(result.body).toBe(JSON.stringify({ data: 'test' }));
  });

  it('should handle RequestInit without headers', () => {
    const vars = new Set<string>();
    const requestInit: RequestInit = {
      method: 'GET'
    };

    const result = maskRequestInit(vars, requestInit);

    expect(result).toEqual(requestInit);
    expect(vars).toEqual(new Set([]));
  });

  it('should handle RequestInit with empty headers', () => {
    const vars = new Set<string>();
    const requestInit: RequestInit = {
      method: 'GET',
      headers: {}
    };

    const result = maskRequestInit(vars, requestInit);

    expect(result.headers).toEqual({});
    expect(vars).toEqual(new Set([]));
  });

  it('should mask multiple authentication headers in RequestInit', () => {
    const vars = new Set<string>();
    const requestInit: RequestInit = {
      method: 'GET',
      headers: {
        'authorization': 'Bearer token123',
        'x-api-key': 'api-key-value',
        'x-access-token': 'access-token-value'
      }
    };

    const result = maskRequestInit(vars, requestInit);

    expect(result.headers).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result.headers).toHaveProperty('x-api-key', '{{apiKey}}');
    expect(result.headers).toHaveProperty('x-access-token', '{{accessToken}}');
    expect(vars).toEqual(new Set(['bearerToken', 'apiKey', 'accessToken']));
  });

  it('should create a new RequestInit object without modifying the original', () => {
    const vars = new Set<string>();
    const originalHeaders = {
      'authorization': 'Bearer token123'
    };
    const requestInit: RequestInit = {
      method: 'GET',
      headers: originalHeaders
    };

    const result = maskRequestInit(vars, requestInit);

    // Check that result has masked headers
    expect(result.headers).toHaveProperty('authorization', 'Bearer {{bearerToken}}');

    // Check that original headers were not modified
    expect(originalHeaders).toEqual({ 'authorization': 'Bearer token123' });

    // Check that result is a different object
    expect(result).not.toBe(requestInit);
  });

  it('should preserve a wide variety of non-authentication headers in RequestInit', () => {
    const vars = new Set<string>();
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token123',
        'x-api-key': 'api-key-value',
        'x-access-token': 'access-token-value',
        'content-type': 'application/json',
        'content-length': '256',
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        'host': 'api.example.com',
        'origin': 'https://example.com',
        'pragma': 'no-cache',
        'referer': 'https://example.com/page',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'custom-header': 'custom-value'
      },
      body: JSON.stringify({ data: 'test' })
    };

    const result = maskRequestInit(vars, requestInit);

    // Verify authentication headers are masked
    expect(result.headers).toHaveProperty('authorization', 'Bearer {{bearerToken}}');
    expect(result.headers).toHaveProperty('x-api-key', '{{apiKey}}');
    expect(result.headers).toHaveProperty('x-access-token', '{{accessToken}}');
    expect(vars).toEqual(new Set(['bearerToken', 'apiKey', 'accessToken']));

    // Verify all non-authentication headers are preserved exactly
    expect(result.headers).toHaveProperty('content-type', 'application/json');
    expect(result.headers).toHaveProperty('content-length', '256');
    expect(result.headers).toHaveProperty('accept', 'application/json, text/plain, */*');
    expect(result.headers).toHaveProperty('accept-encoding', 'gzip, deflate, br');
    expect(result.headers).toHaveProperty('accept-language', 'en-US,en;q=0.9');
    expect(result.headers).toHaveProperty('cache-control', 'no-cache');
    expect(result.headers).toHaveProperty('connection', 'keep-alive');
    expect(result.headers).toHaveProperty('host', 'api.example.com');
    expect(result.headers).toHaveProperty('origin', 'https://example.com');
    expect(result.headers).toHaveProperty('pragma', 'no-cache');
    expect(result.headers).toHaveProperty('referer', 'https://example.com/page');
    expect(result.headers).toHaveProperty('sec-fetch-dest', 'empty');
    expect(result.headers).toHaveProperty('sec-fetch-mode', 'cors');
    expect(result.headers).toHaveProperty('sec-fetch-site', 'same-origin');
    expect(result.headers).toHaveProperty('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(result.headers).toHaveProperty('custom-header', 'custom-value');

    // Verify other RequestInit properties are preserved
    expect(result.method).toBe('POST');
    expect(result.body).toBe(JSON.stringify({ data: 'test' }));
  });
});
