import { hexToUint8Array, uint8ArrayToHex } from './utils.ts';

const HASH_ALGORITHM = 'SHA-256';
const ENCRYPTION_ALGORITHM = { name: 'AES-GCM', length: 256 } as const;
const ITERATIONS = 100_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type Values = [salt: string | null, iv: string, encrypted: string];

/**
 * Encrypts a string using AES-GCM with PBKDF2 key derivation.
 *
 * @param text
 * @param secret
 * @param useSalt
 */
export async function encrypt(
  text: string,
  secret: string,
  useSalt: false,
): Promise<[salt: null, iv: string, encrypted: string]>;
export async function encrypt(
  text: string,
  secret: string,
  useSalt: true,
): Promise<[salt: string, iv: string, encrypted: string]>;
export async function encrypt(text: string, secret: string, useSalt = false): Promise<Values> {
  if (secret.length < 8) {
    throw new Error('Secret must be at least 8 characters long');
  }

  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM requires a 12-byte IV
  const salt = useSalt ? generateSalt() : new Uint8Array(0);
  const key = await getKey(encoder.encode(secret), salt);
  const encrypted = await crypto.subtle.encrypt({ name: ENCRYPTION_ALGORITHM.name, iv }, key, encoder.encode(text));
  return [
    salt.length === 0 ? null : uint8ArrayToHex(salt),
    uint8ArrayToHex(iv),
    uint8ArrayToHex(new Uint8Array(encrypted)),
  ];
}

/**
 * Decrypts an encrypted string using AES-GCM with PBKDF2 key derivation.
 */
export async function decrypt([salt, iv, encrypted]: Values, secret: string): Promise<string> {
  const key = await getKey(encoder.encode(secret), hexToUint8Array(salt ?? ''));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToUint8Array(iv) },
    key,
    hexToUint8Array(encrypted),
  );
  return decoder.decode(decrypted);
}

async function getKey(secret: Uint8Array, salt: Uint8Array) {
  const keyDerivationAlgorithm = 'PBKDF2';
  const keyMaterial = await crypto.subtle.importKey('raw', secret, { name: keyDerivationAlgorithm }, false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {
      name: keyDerivationAlgorithm,
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    ENCRYPTION_ALGORITHM,
    false,
    ['encrypt', 'decrypt'],
  );
}

function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(32));
}
