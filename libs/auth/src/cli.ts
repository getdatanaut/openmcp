import { betterFetch } from '@better-fetch/fetch';
import { generateRandomString } from 'better-auth/crypto';
import { getOAuth2Tokens, type OAuth2Tokens } from 'better-auth/oauth2';
import { createAuthorizationURL, refreshAccessToken } from 'better-auth/oauth2';
import { decodeJwt } from 'jose';
import { z } from 'zod';

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

export type { OAuth2Tokens };

/**
 * Interface for storage operations
 */
export interface Storage {
  /**
   * Stores a value
   * @param key The key to store the value under
   * @param value The value to store
   */
  setItem<K extends keyof OAuth2Tokens>(key: K, value: OAuth2Tokens[K]): Promise<void>;

  /**
   * Retrieves a value from storage
   * @param key The key to retrieve
   * @returns The stored value, or null if not found
   */
  getItem<K extends keyof OAuth2Tokens>(key: K): Promise<OAuth2Tokens[K] | null>;

  /**
   * Removes a value from storage
   * @param key The key to remove
   */
  removeItem<K extends keyof OAuth2Tokens>(key: K): Promise<void>;

  /**
   * Removes all values from storage
   */
  clear(): Promise<void>;
}

export class AuthClient {
  readonly #baseURL: string;
  readonly #basePath: string;
  readonly #clientId: string;
  readonly #storage: Storage;
  #tokens: OAuth2Tokens | null = null;
  #authInitState: Record<'state' | 'codeVerifier' | 'redirectUri', string> | null = null;
  #cachedAccessToken: string | null = null;
  #accessTokenExpiry: Date = new Date(0);

  constructor(baseURL: string, clientId: string, storage: Storage) {
    this.#baseURL = baseURL;
    this.#basePath = '/api/auth';
    this.#clientId = clientId;
    this.#storage = storage;
  }

  async initialize() {
    try {
      const [idToken, accessToken, refreshToken] = await Promise.all([
        this.#storage.getItem('idToken'),
        this.#storage.getItem('accessToken'),
        this.#storage.getItem('refreshToken'),
      ]);

      if (idToken === null || accessToken === null || refreshToken === null) {
        throw new Error('Missing tokens');
      }

      this.#tokens = { idToken, accessToken, refreshToken };
    } catch {
      this.#tokens = null;
    }
  }

  #unwrapToken(name: 'idToken' | 'accessToken' | 'refreshToken'): string {
    if (this.#tokens === null) {
      throw new Error('You seem to be logged out. Please log in again.');
    }

    const value = this.#tokens[name];
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Missing or invalid "${name}" token. You may need to log in again.`);
    }

    return value;
  }

  async clearTokens() {
    await Promise.all([
      this.#storage.removeItem('idToken'),
      this.#storage.removeItem('accessToken'),
      this.#storage.removeItem('refreshToken'),
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
  getDecodedIdToken() {
    return decodeJwt(this.#unwrapToken('idToken'));
  }

  /**
   * Exchanges an authorization code for a set of tokens.
   *
   * @param code - The authorization code received from the authorization server.
   * @return A promise that resolves to the tokens object containing id_token, access_token, and refresh_token.
   * @throws If the authentication flow is not initiated or the token exchange fails.
   */
  async exchangeCodeForTokens(code: string): Promise<OAuth2Tokens> {
    if (!this.#authInitState) {
      throw new Error('Auth flow not initiated');
    }

    const { codeVerifier, redirectUri } = this.#authInitState;

    const { data, error } = await betterFetch(this.#resolveRoute(Routes.exchangeToken).toString(), {
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
      output: z.object({
        id_token: z.string(),
        access_token: z.string(),
        refresh_token: z.string(),
      }),
    });

    if (error) {
      throw error;
    }

    const tokens = getOAuth2Tokens(data);
    this.#tokens = tokens;
    await Promise.all([
      this.#storage.setItem('idToken', tokens.idToken),
      this.#storage.setItem('accessToken', tokens.accessToken),
      this.#storage.setItem('refreshToken', tokens.refreshToken),
    ]);
    return tokens;
  }

  /**
   * Generates or retrieves a cached access token
   * @returns The access token
   */
  async generateAccessToken(): Promise<string> {
    // If we have a cached token that's still valid (with a 30-second buffer)
    const currentTime = new Date(Date.now() + 30 * 1000);
    if (this.#cachedAccessToken !== null && this.#accessTokenExpiry > currentTime) {
      return this.#cachedAccessToken;
    }

    const refreshToken = this.#unwrapToken('refreshToken');

    let tokens: OAuth2Tokens;
    try {
      tokens = await refreshAccessToken({
        grantType: 'refresh_token',
        tokenEndpoint: this.#resolveRoute(Routes.token).href,
        refreshToken,
        options: {
          clientId: this.#clientId,
          clientSecret: '',
        },
      });

      if (!tokens.accessToken) {
        throw new Error('No access token returned');
      }
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to generate access token. You may need to log in again. ${String(error)}`);
    }

    const accessToken = tokens.accessToken;
    this.#cachedAccessToken = accessToken;
    this.#tokens!.accessToken = accessToken;
    await this.#storage.setItem('accessToken', accessToken);

    this.#accessTokenExpiry = tokens.accessTokenExpiresAt ?? new Date(0);

    if (tokens.refreshToken) {
      this.#tokens!.refreshToken = tokens.refreshToken;
      await this.#storage.setItem('refreshToken', tokens.refreshToken);
    }

    return accessToken;
  }

  /**
   * Initiates the authorization flow by generating the required state, code verifier,
   * and code challenge, then constructs the authorization URL.
   *
   * @param  redirectUri - The URI where the authorization server will redirect to after user authorization.
   * @return A promise that resolves to the constructed authorization URL.
   * @throws {Error} If the authorization flow has already been initiated.
   */
  async initiateAuthFlow(redirectUri: URL): Promise<URL> {
    if (this.#authInitState !== null) {
      throw new Error('Auth flow already initiated');
    }

    const codeVerifier = generateRandomString(128);
    const state = generateRandomString(32);
    this.#authInitState = {
      state,
      codeVerifier,
      redirectUri: redirectUri.toString(),
    };

    return createAuthorizationURL({
      id: generateRandomString(16),
      authorizationEndpoint: this.#resolveRoute(Routes.authorize).toString(),
      redirectURI: redirectUri.toString(),
      responseType: 'code',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      prompt: 'consent',
      codeVerifier,
      state, // Include CSRF token
      options: {
        clientId: this.#clientId,
        clientSecret: '',
      },
    });
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
