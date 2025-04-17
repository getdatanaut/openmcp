import type ConfigSchema from './config-schema.ts';
import { toInterpolable } from './string.ts';

/**
 * Mask common authentication information used in headers.
 * It checks for:
 * - The "Authorization" header (e.g. "Bearer <token>")
 * - "X-Api-Key" header
 * - "X-Access-Token" header
 *
 * @param configSchema - This is used to track which variables have been masked.
 * @param headers - An object representing the headers.
 * @returns An object containing the extracted auth information.
 */
export default function maskHeaders(configSchema: ConfigSchema, headers: Headers): Record<string, string> {
  const maskedHeaders = new Headers(headers);
  // If it starts with "Bearer ", extract the token.
  const authorizationHeader = headers.get('authorization');
  if (authorizationHeader !== null && authorizationHeader.length > 0) {
    maskedHeaders.set('authorization', maskAuthorizationHeader(configSchema, authorizationHeader));
  }

  // Check for "x-api-key"
  const xApiKeyValue = headers.get('x-api-key');
  if (isNonEmpty(xApiKeyValue)) {
    const registeredKey = configSchema.add('apiKey', 'string');
    maskedHeaders.set('x-api-key', toInterpolable(registeredKey));
  }

  // Check for "x-access-token"
  const xAccessToken = headers.get('x-access-token');
  if (isNonEmpty(xAccessToken)) {
    const registeredKey = configSchema.add('accessToken', 'string');
    maskedHeaders.set('x-access-token', toInterpolable(registeredKey));
  }

  return Object.fromEntries(maskedHeaders);
}

function maskAuthorizationHeader(configSchema: ConfigSchema, header: string): string {
  const lowerCased = header.toLowerCase();
  switch (true) {
    case lowerCased.startsWith('bearer '): {
      const registeredKey = configSchema.add('bearerToken', 'string');
      return `Bearer ${toInterpolable(registeredKey)}`;
    }
    case lowerCased.startsWith('basic '): {
      const registeredKey = configSchema.add('basicAuth', 'string');
      return `Basic ${toInterpolable(registeredKey)}`;
    }
    case true:
    default: {
      const registeredKey = configSchema.add('authorization', 'string');
      return toInterpolable(registeredKey);
    }
  }
}

function isNonEmpty(header: string | null): header is string {
  return header !== null && header.length > 0;
}
