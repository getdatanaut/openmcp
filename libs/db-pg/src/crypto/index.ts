import { decrypt as _decrypt, encrypt as _encrypt } from './crypto.ts';
import { assertEncryptedPayload } from './guards.ts';
import { type EncryptedPayload, HEADER } from './types.ts';

export { assertEncryptedPayload, isEncryptedPayload } from './guards.ts';
export type { EncryptedPayload } from './types.ts';

/**
 * Encrypts a string using AES-GCM with PBKDF2 key derivation.
 * @param value - The string to encrypt.
 * @param secret - The password used for encryption.
 * @returns EncryptedPayload
 */
export async function encrypt(value: string, secret: string): Promise<EncryptedPayload> {
  const values = await _encrypt(value, secret, false);
  return `${HEADER}${values.filter(Boolean).join(':')}`;
}

/**
 * Encrypts a string using AES-GCM with PBKDF2 key derivation and a salt.
 *
 * @param value - The string to encrypt.
 * @param secret - The password used for encryption.
 */
export async function saltedEncrypt(value: string, secret: string): Promise<EncryptedPayload> {
  const values = await _encrypt(value, secret, true);
  return `${HEADER}${values.filter(Boolean).join(':')}`;
}

/**
 * Decrypts an encrypted string using AES-GCM with PBKDF2 key derivation.
 *
 * @param value
 * @param secret - must be one of the passwords set by us
 * @returns decrypted string
 */
export async function decrypt(value: string, secret: string): Promise<string> {
  assertEncryptedPayload(value);

  const parts = value.slice(HEADER.length).split(':');

  if (parts.length < 2 || parts.length > 3) {
    throw new Error('Invalid encrypted text format');
  }

  const text = parts.at(-1)!;
  const iv = parts.at(-2)!;
  const salt = parts.at(-3) ?? null;

  return _decrypt([salt, iv, text], secret);
}
