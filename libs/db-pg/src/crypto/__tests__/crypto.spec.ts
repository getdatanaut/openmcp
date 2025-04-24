import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from '../crypto.ts';

describe('encrypt', () => {
  const secret = 'mySecret';
  const text = 'Hello, World!';

  it.concurrent('given no salt, should encrypt a string with a given secret', async () => {
    const payload = await encrypt(text, secret, false);
    expect(payload).toHaveLength(3);
    expect(payload[0]).toBeNull();
    expect(payload[1]).toMatch(/^[0-9a-f]{24}$/); // 12 bytes IV in hex
    expect(payload[2]).toMatch(/^[0-9a-f]+$/);
  });

  it.concurrent('given salt, should encrypt a string with a given secret and return a used salt', async () => {
    const payload = await encrypt(text, secret, true);
    expect(payload).toHaveLength(3);
    expect(payload[0]).toMatch(/^[0-9a-f]{64}$/); // the salt is 32 bytes in hex
    expect(payload[1]).toMatch(/^[0-9a-f]{24}$/); // 12 bytes IV in hex
    expect(payload[2]).toMatch(/^[0-9a-f]+$/);
  });

  it.concurrent('should throw an error if secret is too short', async () => {
    await expect(encrypt(text, '', false)).rejects.toThrow('Secret must be at least 8 characters long');
    await expect(encrypt(text, 'abcdefg', true)).rejects.toThrow('Secret must be at least 8 characters long');
  });
});

describe('decrypt', () => {
  const text = 'Hello, World!';
  const secret = 'mySecret';

  it.concurrent('given no salt, should decrypt an encrypted string back to the original text', async () => {
    const encrypted = await encrypt(text, secret, false);
    await expect(decrypt(encrypted, secret)).resolves.toBe(text);
  });

  it.concurrent('given salt, should decrypt an encrypted string back to the original text', async () => {
    const encrypted = await encrypt(text, secret, true);
    await expect(decrypt(encrypted, secret)).resolves.toBe(text);
  });

  it.concurrent('should throw an error if secret is incorrect', async () => {
    const wrongSecret = 'wrongSecret';
    const encrypted = await encrypt(text, secret, false);
    await expect(decrypt(encrypted, wrongSecret)).rejects.toThrow();
  });
});
