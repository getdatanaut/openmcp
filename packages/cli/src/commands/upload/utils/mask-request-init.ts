import type ConfigSchema from './config-schema.ts';
import maskHeaders from './mask-headers.ts';

/**
 * Masks sensitive headers in a RequestInit object based on a set of variable names.
 *
 * @param configSchema - A set of header names that should be masked.
 * @param requestInit - The original RequestInit object containing the request parameters and headers.
 * @return A new RequestInit object with the specified headers masked.
 */
export default function maskRequestInit(configSchema: ConfigSchema, requestInit: RequestInit): RequestInit {
  const maskedRequestInit: RequestInit = {
    ...requestInit,
  };
  if (maskedRequestInit.headers) {
    maskedRequestInit.headers = maskHeaders(configSchema, new Headers(requestInit.headers));
  }

  return maskedRequestInit;
}
