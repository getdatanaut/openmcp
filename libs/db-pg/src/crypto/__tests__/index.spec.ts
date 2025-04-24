import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from '../index.ts';
import { HEADER } from '../types.ts';

describe('encrypt', () => {
  it.concurrent('should encrypt a value and return a valid encrypted payload', async () => {
    const secret = 'password';
    const value = 'sensitive-data';
    await expect(encrypt(value, secret)).resolves.toMatch(new RegExp(`^${HEADER}.+:.+$`));
  });
});

describe('decrypt', () => {
  const secret = 'some-password';

  it.concurrent('should decrypt a valid encrypted payload and return the original value', async () => {
    const value = 'sensitive-data';
    const encrypted = await encrypt(value, secret);
    await expect(decrypt(encrypted, secret)).resolves.toBe(value);
  });

  it.concurrent('should throw an error if the payload does not start with the correct header', async () => {
    const invalidPayload = 'INVALID_HEADER:iv:text';
    await expect(decrypt(invalidPayload, secret)).rejects.toThrow('Invalid encrypted text format');
  });

  it.concurrent('should throw an error if the payload has an invalid format', async () => {
    const invalidPayload = `${HEADER}invalid-format`;
    await expect(decrypt(invalidPayload, secret)).rejects.toThrow('Invalid encrypted text format');
  });

  it.concurrent('should throw an error if secret is incorrect', async () => {
    const wrongSecret = 'wrongSecret';
    const value = 'sensitive-data';
    const encrypted = await encrypt(value, secret);
    await expect(decrypt(encrypted, wrongSecret)).rejects.toThrow();
  });

  it.concurrent('should throw an error if the payload is missing the IV or text', async () => {
    const invalidPayload = `${HEADER}iv-only:`;
    await expect(decrypt(invalidPayload, secret)).rejects.toThrow('Invalid hex string length');
  });
});
