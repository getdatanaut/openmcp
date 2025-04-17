import { describe, expect, it } from 'vitest';

import maskUrl from '../mask-url.ts';

describe('maskUrl', () => {
  it('should mask username and password in URL', () => {
    const vars = new Set<string>();
    const url = new URL('https://user:pass@example.com');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://{{username}}:{{password}}@example.com');
    expect(vars).toEqual(new Set(['username', 'password']));
  });

  it('should mask only username when password is not present', () => {
    const vars = new Set<string>();
    const url = new URL('https://user@example.com');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://{{username}}@example.com');
    expect(vars).toEqual(new Set(['username']));
  });

  it('should mask authentication query parameters', () => {
    const vars = new Set<string>();
    const url = new URL('https://example.com/api?token=secret123&other=value');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://example.com/api?token={{token}}&other=value');
    expect(vars).toEqual(new Set(['token']));
  });

  it('should mask multiple authentication query parameters', () => {
    const vars = new Set<string>();
    const url = new URL('https://example.com/api?token=secret123&access_token=abc&api_key=xyz');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://example.com/api?token={{token}}&access_token={{access_token}}&api_key={{api_key}}');
    expect(vars).toEqual(new Set(['token', 'access_token', 'api_key']));
  });

  it('should not mask non-authentication query parameters', () => {
    const vars = new Set<string>();
    const url = new URL('https://example.com/api?param1=value1&param2=value2');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://example.com/api?param1=value1&param2=value2');
    expect(vars).toEqual(new Set([]));
  });

  it('should handle URLs without query parameters', () => {
    const vars = new Set<string>();
    const url = new URL('https://example.com/path');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://example.com/path');
    expect(vars).toEqual(new Set([]));
  });

  it('should handle URLs with empty authentication parameter values', () => {
    const vars = new Set<string>();
    const url = new URL('https://example.com/api?token=&param=value');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://example.com/api?token=&param=value');
    expect(vars).toEqual(new Set([]));
  });

  it('should handle URLs with both credentials and auth query parameters', () => {
    const vars = new Set<string>();
    const url = new URL('https://user:pass@example.com/api?token=secret&param=value');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://{{username}}:{{password}}@example.com/api?token={{token}}&param=value');
    expect(vars).toEqual(new Set(['username', 'password', 'token']));
  });

  it('should not add trailing ampersand to query string', () => {
    const vars = new Set<string>();
    const url = new URL('https://example.com/api?param=value');

    const result = maskUrl(vars, url);

    expect(result).toBe('https://example.com/api?param=value');
    expect(vars).toEqual(new Set([]));
  });
});
