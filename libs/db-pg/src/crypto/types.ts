export const HEADER = 'dnenc_' as const;

export type EncryptedPayload = `${typeof HEADER}${string}`;
