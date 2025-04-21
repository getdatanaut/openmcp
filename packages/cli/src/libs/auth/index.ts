import { clearTimeout, setTimeout } from 'node:timers';

import { createAuthClient } from '@libs/auth/cli';
import open from 'open';

import env from '../../env.ts';
import { startServer, waitForAuthorizationCallback } from './server.ts';
import Storage from './storage/index.ts';

export const client = await createAuthClient({
  hostURL: env.DN_API_URL,
  clientId: env.DN_CLIENT_ID,
  storage: await Storage.create('auth'),
});

export async function login() {
  const LOGIN_TIMEOUT = 1000 * 60 * 5; // 5 minutes

  const controller = new AbortController();
  const tId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT);
  using server = await startServer(controller.signal);
  try {
    const authorizeUrl = await client.initiateAuthFlow(server.address);
    console.log(`Opening ${authorizeUrl.toString()}`);

    await Promise.all([
      waitForAuthorizationCallback(server, client).then(code => client.exchangeCodeForTokens(code)),
      open(authorizeUrl.toString()),
    ]);

    const decoded = client.getDecodedIdToken();
    return {
      email: String(decoded['email']),
    };
  } finally {
    clearTimeout(tId);
  }
}

export async function logout() {
  await client.clearTokens();
}
