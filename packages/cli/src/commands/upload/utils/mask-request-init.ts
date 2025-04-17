import maskHeaders from './mask-headers.ts';

/**
 * Masks sensitive headers in a RequestInit object based on a set of variable names.
 *
 * @param {Set<string>} vars - A set of header names that should be masked.
 * @param {RequestInit} requestInit - The original RequestInit object containing the request parameters and headers.
 * @return {RequestInit} A new RequestInit object with the specified headers masked.
 */
export default function maskRequestInit(vars: Set<string>, requestInit: RequestInit): RequestInit {
  const maskedRequestInit: RequestInit = {
    ...requestInit,
  };
  if (maskedRequestInit.headers) {
    maskedRequestInit.headers = maskHeaders(vars, new Headers(requestInit.headers));
  }

  return maskedRequestInit;
}
