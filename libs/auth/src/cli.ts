import { generateRandomString } from 'better-auth/crypto';

import Routes from './routes.ts';

export const createAuthClient = async ({
  hostURL,
  clientId,
  storage,
}: {
  hostURL: string;
  clientId: string;
  storage: Storage;
}) => {
  const auth = new AuthClient(hostURL, clientId, storage);
  await auth.initialize();
  return auth;
};

type Tokens = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
};

/**
 * Interface for storage operations
 */
export interface Storage {
  /**
   * Stores a value
   * @param key The key to store the value under
   * @param value The value to store
   */
  setItem<K extends keyof Tokens>(key: K, value: Tokens[K]): Promise<void>;

  /**
   * Retrieves a value from storage
   * @param key The key to retrieve
   * @returns The stored value, or null if not found
   */
  getItem<K extends keyof Tokens>(key: K): Promise<Tokens[K] | null>;

  /**
   * Removes a value from storage
   * @param key The key to remove
   */
  removeItem<K extends keyof Tokens>(key: K): Promise<void>;
}

// @todo: try to use sdk more
export class AuthClient {
  readonly #baseURL: string;
  readonly #basePath: string;
  readonly #clientId: string;
  readonly #storage: Storage;
  #tokens: Tokens | null = null;
  #authInitState: Record<'state' | 'codeVerifier' | 'redirectUri', string> | null = null;
  #cachedAccessToken: string | null = null;
  #accessTokenExpiry: number = 0;

  constructor(baseURL: string, clientId: string, storage: Storage) {
    this.#baseURL = baseURL;
    this.#basePath = '/api/auth';
    this.#clientId = clientId;
    this.#storage = storage;
  }

  async initialize() {
    try {
      const [idToken, accessToken, refreshToken] = await Promise.all([
        this.#storage.getItem('id_token'),
        this.#storage.getItem('access_token'),
        this.#storage.getItem('refresh_token'),
      ]);

      if (idToken === null || accessToken === null || refreshToken === null) {
        throw new Error('Missing tokens');
      }

      this.#tokens = {
        id_token: idToken,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch {
      this.#tokens = null;
    }
  }

  async clearTokens() {
    await Promise.all([
      this.#storage.removeItem('id_token'),
      this.#storage.removeItem('access_token'),
      this.#storage.removeItem('refresh_token'),
    ]);
    this.#tokens = null;
  }

  #resolveRoute(route: string) {
    return new URL(this.#basePath + route, this.#baseURL);
  }

  /**
   * Decodes an ID token without validation
   *
   * @returns The decoded payload
   * @throws If the ID token is invalid or missing
   */
  getDecodedIdToken(): Record<string, unknown> {
    const idToken = this.#tokens?.id_token;
    if (!idToken) {
      throw new Error('No ID token available');
    }

    const split = idToken.split('.');
    if (split.length !== 3) {
      throw new Error('Invalid ID token format');
    }

    try {
      const base64Url = split[1]!;
      const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error(`Invalid ID token format: ${error}`);
    }
  }

  /**
   * Exchanges an authorization code for a set of tokens.
   *
   * @param code - The authorization code received from the authorization server.
   * @return A promise that resolves to the tokens object containing id_token, access_token, and refresh_token.
   * @throws If the authentication flow is not initiated or the token exchange fails.
   */
  async exchangeCodeForTokens(code: string): Promise<Tokens> {
    if (!this.#authInitState) {
      throw new Error('Auth flow not initiated');
    }

    const { codeVerifier, redirectUri } = this.#authInitState;

    const res = await fetch(this.#resolveRoute(Routes.exchangeToken), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        client_id: this.#clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = (await res.json()) as Tokens;
    this.#tokens = tokens;
    await Promise.all([
      this.#storage.setItem('id_token', tokens.id_token),
      this.#storage.setItem('access_token', tokens.access_token),
      this.#storage.setItem('refresh_token', tokens.refresh_token),
    ]);
    return tokens;
  }

  /**
   * Generates or retrieves a cached access token
   * @returns The access token
   */
  async generateAccessToken(): Promise<string> {
    const currentTime = Date.now();

    // If we have a cached token that's still valid (with a 30-second buffer)
    if (this.#cachedAccessToken && this.#accessTokenExpiry > currentTime + 30000) {
      return this.#cachedAccessToken;
    }

    if (!this.#tokens?.refresh_token) {
      throw new Error('No refresh_token available');
    }

    const res = await fetch(this.#resolveRoute(Routes.token), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.#tokens.refresh_token,
        client_id: this.#clientId,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate access token');
    }

    const tokens = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    this.#cachedAccessToken = tokens.access_token;

    const expiresIn = tokens.expires_in || 3600;
    this.#accessTokenExpiry = currentTime + expiresIn * 1000;

    this.#tokens.access_token = this.#cachedAccessToken;
    await this.#storage.setItem('access_token', this.#cachedAccessToken);

    if (tokens.refresh_token) {
      this.#tokens.refresh_token = tokens.refresh_token;
      await this.#storage.setItem('refresh_token', tokens.refresh_token);
    }

    return this.#cachedAccessToken;
  }

  async initiateAuthFlow(redirectUri: URL): Promise<URL> {
    if (this.#authInitState !== null) {
      throw new Error('Auth flow already initiated');
    }

    const codeVerifier = generateCodeVerifier(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    this.#authInitState = {
      state,
      codeVerifier,
      redirectUri: redirectUri.toString(),
    };

    const authorizeUrl = this.#resolveRoute(Routes.authorize);
    authorizeUrl.searchParams.set('client_id', this.#clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri.toString());
    authorizeUrl.searchParams.set('response_type', 'code'); // Use Authorization Code flow
    authorizeUrl.searchParams.set('scope', ['openid', 'profile', 'email', 'offline_access'].join(' '));
    authorizeUrl.searchParams.set('state', state); // Include CSRF token
    authorizeUrl.searchParams.set('prompt', 'consent');
    authorizeUrl.searchParams.set('code_challenge', codeChallenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    // to aid with some redirect issue that appends localhost url to the end :shrug:
    authorizeUrl.searchParams.set('e', 'a');
    return authorizeUrl;
  }

  assertValidState(state: string) {
    if (!this.#authInitState?.state) {
      throw new Error('No state was set');
    }

    if (state !== this.#authInitState.state) {
      throw new Error('Mismatched state');
    }
  }
}

/**
 * Generates a code verifier, which is a cryptographically secure random string
 * typically used in OAuth 2.0 PKCE (Proof Key for Code Exchange) flows.
 * The generated code verifier is a URL-safe Base64-encoded string derived from 512 bits of randomness.
 *
 * @param length - The length of the code verifier string to generate.
 * @return A URL-safe Base64-encoded code verifier string.
 */
function generateCodeVerifier(length: number) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return toBase64Url(array);
}

/**
 * Generates a code challenge string based on the given code verifier using the SHA-256 hashing algorithm
 * and encodes it as a Base64 URL-safe format.
 *
 * @param codeVerifier - The code verifier string that is used as input to generate the code challenge.
 * @return A promise that resolves to the generated code challenge as a URL-safe Base64 encoded string.
 */
async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const verifierBytes = encoder.encode(codeVerifier);

  const hashBuffer = await crypto.subtle.digest('SHA-256', verifierBytes);
  return toBase64Url(hashBuffer);
}

function toBase64Url(buffer: ArrayBuffer) {
  const hashArray = Array.from(new Uint8Array(buffer));
  const base64String = btoa(String.fromCharCode(...hashArray));
  return base64String.replace(/\+/g, '-').replaceAll('/', '_').replace(/=+$/, ''); // URL-safe Base64
}
