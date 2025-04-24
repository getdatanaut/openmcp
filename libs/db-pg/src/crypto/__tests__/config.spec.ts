import { describe, expect, it } from 'vitest';

import { decryptConfig, encryptConfig } from '../config.ts';
import { encrypt } from '../encrypt.ts';
import { isEncryptedPayload } from '../guards.ts';

const secret = 'mySecret';

const config = {
  username: 'admin',
  password: 'password',
};

const schema = {
  properties: {
    username: {
      type: 'string',
    },
    password: {
      type: 'string',
      format: 'secret',
    },
  },
} as const;

describe('encryptConfig', () => {
  it.concurrent('encrypts secrets and leaves other values alone', async () => {
    const result = await encryptConfig({ secret, config, schema });

    expect(result['username']).toBe('admin');
    expect(isEncryptedPayload(result['password'])).toBe(true);
  });

  it.concurrent('leaves secret alone if already encrypted', async () => {
    const encryptedPassword = await encrypt(config.password, secret);
    const result = await encryptConfig({
      secret,
      config: {
        ...config,
        password: encryptedPassword,
      },
      schema,
    });

    expect(result['password']).toBe(encryptedPassword);
  });

  it.concurrent('throws if a config key is not defined in the schema', async () => {
    const pending = encryptConfig({
      secret,
      config: {
        ...config,
        extra: 'extra',
      },
      schema,
    });

    await expect(pending).rejects.toThrow();
  });

  it.concurrent('does not mutate the passed config', async () => {
    const originalConfig = { ...config };
    await encryptConfig({ secret, config, schema });

    // Verify the original config is unchanged
    expect(config).toEqual(originalConfig);
  });
});

describe('decryptConfig', () => {
  it.concurrent('decrypts encrypted values, and leaves other values alone', async () => {
    const encryptedConfig = await encryptConfig({ secret, config, schema });
    const decryptedConfig = await decryptConfig({ config: encryptedConfig, secret });

    expect(decryptedConfig['password']).toBe(config['password']);
    expect(decryptedConfig['username']).toBe(config['username']);
  });
});
