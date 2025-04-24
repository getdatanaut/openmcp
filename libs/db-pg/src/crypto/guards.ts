import { type EncryptedPayload, HEADER } from './types.ts';

export function isEncryptedPayload(maybeEncryptedPayload: unknown): maybeEncryptedPayload is EncryptedPayload {
  return typeof maybeEncryptedPayload === 'string' && maybeEncryptedPayload.startsWith(HEADER);
}

export function assertEncryptedPayload(
  maybeEncryptedPayload: string,
): asserts maybeEncryptedPayload is EncryptedPayload {
  if (!isEncryptedPayload(maybeEncryptedPayload)) {
    throw new Error('Invalid encrypted text format');
  }
}
