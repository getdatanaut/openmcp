import type { DbSdk } from '@libs/db-pg';
import { type APIError } from 'better-auth';

import type { Auth } from './server.ts';

// Standard OAuth 2.0 error types as per RFC 6749
const OAUTH_ERROR_TYPES = {
  INVALID_REQUEST: 'invalid_request',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  INVALID_SCOPE: 'invalid_scope',
};

/**
 * Creates an OAuth 2.0 compliant error response
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
function createOAuthErrorResponse(error: string, description: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error,
      error_description: description,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
      status,
    },
  );
}

/**
 * Handles OAuth 2.0 token exchange requests
 * @see https://datatracker.ietf.org/doc/html/rfc6749
 */
export async function exchangeToken(req: Request, db: DbSdk, sdk: Auth): Promise<Response> {
  if (req.method !== 'POST') {
    return createOAuthErrorResponse(OAUTH_ERROR_TYPES.INVALID_REQUEST, 'Token requests must use POST method', 405);
  }

  const bodyText = await req.text();
  const searchParams = new URLSearchParams(bodyText);

  const clientId = searchParams.get('client_id');
  if (!clientId) {
    return createOAuthErrorResponse(OAUTH_ERROR_TYPES.INVALID_CLIENT, 'Missing client_id parameter', 400);
  }

  try {
    const clientSecret = await db.queries.oauthApplication.getClientSecretByClientId(clientId);
    if (clientSecret === null) {
      return createOAuthErrorResponse(OAUTH_ERROR_TYPES.INVALID_CLIENT, 'Unknown client', 400);
    }

    searchParams.set('client_secret', clientSecret);

    const oauth2Token = await sdk.api.oAuth2token({
      method: 'POST',
      body: Object.fromEntries(searchParams),
    });

    return new Response(JSON.stringify(oauth2Token), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
      status: 200,
    });
  } catch (error) {
    if (isAPIError(error)) {
      // Return OAuth-compliant error from the SDK
      return new Response(JSON.stringify(error.body ?? {}), {
        headers: {
          ...error.headers,
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
        status: error.statusCode,
      });
    }

    // Handle unexpected errors with a compliant server_error response
    return createOAuthErrorResponse('server_error', 'An unexpected error occurred', 500);
  }
}

function isAPIError(maybeAPIError: unknown): maybeAPIError is APIError {
  return maybeAPIError instanceof Error && maybeAPIError.name === 'APIError';
}
