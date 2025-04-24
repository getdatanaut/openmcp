import { describe, expect, it } from 'vitest';

import { encrypt } from '../encrypt.ts';
import { HEADER } from '../types.ts';

describe('encrypt', () => {
  it.concurrent('should encrypt a value and return a valid encrypted payload', async () => {
    const secret = 'password';
    const value = 'sensitive-data';
    await expect(encrypt(value, secret)).resolves.toMatch(new RegExp(`^${HEADER}.+:.+$`));
  });
});
