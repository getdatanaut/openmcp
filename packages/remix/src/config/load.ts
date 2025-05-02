import { type IO, loadDocument } from '@openmcp/utils/documents';
import path from 'path-browserify';

import parseConfig from './parse.ts';
import type { Config, RemixServer } from './schemas.ts';

function isEnvVar(value: unknown): value is string {
  return typeof value === 'string' && value.length === 0;
}

function resolveClientConfig(clientConfig: Record<string, unknown>, env: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(clientConfig)) {
    if (!isEnvVar(value)) {
      continue;
    }

    if (!Object.hasOwn(env, key)) {
      throw new Error(`Environment variable ${value} is not defined. Please define it before running the command.`);
    }

    clientConfig[key] = env[key];
  }
}

function resolveServer(location: string, server: RemixServer): void {
  if (server.type !== 'openapi') return;

  // urls do not need to be rewritten
  if (URL.canParse(server.openapi)) return;

  try {
    const url = new URL(location);
    if (path.isAbsolute(server.openapi)) {
      url.pathname = server.openapi;
    } else {
      url.pathname = path.join(path.dirname(url.pathname), server.openapi);
    }

    server.openapi = url.toString();
  } catch {
    if (!path.isAbsolute(server.openapi)) {
      server.openapi = path.join(path.dirname(location), server.openapi);
    }
  }
}

type Context = {
  readonly cwd: string;
  readonly io: IO;
  readonly env: Record<string, unknown>;
};

export default async function load({ io, env }: Context, location: string): Promise<Config> {
  const maybeConfig = await loadDocument(io, location, {
    parseJsonAsJsonc: true,
  });

  const config = parseConfig(maybeConfig);
  const { configs, servers } = config;
  for (const config of Object.values(configs)) {
    resolveClientConfig(config, env);
  }
  for (const server of Object.values(servers)) {
    resolveServer(location, server);
  }

  return config;
}
