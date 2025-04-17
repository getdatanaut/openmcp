/**
 * Mask common authentication information used in headers.
 * It checks for:
 * - The "Authorization" header (e.g. "Bearer <token>")
 * - "X-Api-Key" header
 * - "X-Access-Token" header
 *
 * @param vars - This is used to track which variables have been masked.
 * @param headers - An object representing the headers.
 * @returns An object containing the extracted auth information.
 */
export default function maskHeaders(vars: Set<string>, headers: Headers): Record<string, string | string> {
  const maskedHeaders = new Headers(headers);
  // If it starts with "Bearer ", extract the token.
  const authorizationHeader = headers.get('authorization');
  if (authorizationHeader !== null && authorizationHeader.length > 0) {
    maskedHeaders.set('authorization', maskAuthorizationHeader(vars, authorizationHeader));
  }

  // Check for "x-api-key"
  const xApiKeyValue = headers.get('x-api-key');
  if (isNonEmpty(xApiKeyValue)) {
    vars.add('apiKey');
    maskedHeaders.set('x-api-key', `{{apiKey}}`);
  }

  // Check for "x-access-token"
  const xAccessToken = headers.get('x-access-token');
  if (isNonEmpty(xAccessToken)) {
    vars.add('accessToken');
    maskedHeaders.set('x-access-token', `{{accessToken}}`);
  }

  return Object.fromEntries(maskedHeaders);
}

function maskAuthorizationHeader(vars: Set<string>, header: string): string {
  const lowerCased = header.toLowerCase();
  switch (true) {
    case lowerCased.startsWith('bearer '):
      vars.add('bearerToken');
      return `Bearer {{bearerToken}}`;
    case lowerCased.startsWith('basic '):
      vars.add('basicAuth');
      return `Basic {{basicAuth}}`;
    case true:
    default:
      vars.add('authorization');
      return '{{authorization}}';
  }
}

function isNonEmpty(header: string | null): header is string {
  return header !== null && header.length > 0;
}
