import { EventEmitter } from 'node:events';
import * as http from 'node:http';

import type { AuthClient } from '@libs/auth/cli';

import env from '../../env.ts';

class HandledError extends Error {
  public readonly code: number;

  constructor(code: number, message?: string) {
    super(message);
    this.code = code;
  }
}

type ServerEventMap = {
  request: [http.IncomingMessage, http.ServerResponse];
  error: [Error];
};

type Server = Disposable & {
  address: URL;
  events: EventEmitter<ServerEventMap>;
};

export async function startServer(signal: AbortSignal): Promise<Server> {
  const emitter = new EventEmitter<ServerEventMap>();

  const server = http.createServer((req, res) => {
    emitter.emit('request', req, res);
  });

  // Handle server errors
  server.on('error', err => {
    emitter.emit('error', err);
  });

  const address = new URL('http://localhost');

  for (const port of [3000, 3001, 3002, 4555, 4556, 4557, 8000, 8001, 8002]) {
    const { promise, reject, resolve } = Promise.withResolvers<boolean>();
    server.listen(
      {
        signal,
        port,
        exclusive: true, // only allow one server to listen on this port
      },
      () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          server.close();
          reject(new Error('Failed to get server address'));
        } else {
          resolve(true);
        }
      },
    );

    if (await promise) {
      address.port = String(port);
      break;
    }
  }

  return {
    address,
    events: emitter,
    [Symbol.dispose]() {
      server.close();
      emitter.removeAllListeners();
    },
  };
}

export async function waitForAuthorizationCallback(server: Server, client: AuthClient) {
  const { promise, reject, resolve } = Promise.withResolvers<string>();
  const origin = new URL(env.DN_API_URL).origin;
  server.events.on('request', function handler(req, res) {
    res.appendHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.writeHead(200).end();
      return;
    }

    if (req.method !== 'GET') {
      throw new HandledError(405, 'Method not allowed.');
    }

    res.setHeader('Content-Type', 'text/plain');

    try {
      if (!req.url) {
        throw new HandledError(400, 'No URL provided.');
      }

      const searchParams = new URL(req.url, 'http://localhost').searchParams;
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (state === null) {
        throw new HandledError(400, 'No state parameter provided.');
      }

      try {
        client.assertValidState(state);
      } catch {
        throw new HandledError(400, 'Invalid state parameter. Possible CSRF attack.');
      }

      if (code === null) {
        throw new HandledError(400, 'No code provided.');
      }

      resolve(code);
      res.writeHead(200).end();
    } catch (ex) {
      if (ex instanceof HandledError) {
        res.writeHead(ex.code).end(ex.message);
        reject(ex);
      } else {
        res.writeHead(500);
        res.end('Internal server error.');
      }
    } finally {
      server.events.off('request', handler);
    }
  });

  return promise;
}
