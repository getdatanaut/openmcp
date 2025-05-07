import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { loadDocument } from '@openmcp/utils/documents';

import console from '#libs/console';
import * as prompt from '#libs/console/prompts';
import { listTools, negotiateSecurityStrategy, negotiateServerUrl, parseAsService } from '#libs/openapi';
import type { Config as RemixDefinition, OpenAPIServer } from '#libs/remix';
import { screamCase, slugify } from '#libs/string-utils';

function findExistingServer(
  servers: RemixDefinition['servers'],
  remixFilepath: string,
  openapiLocation: string,
): { name: string; server: OpenAPIServer } | null {
  const absoluteLocation = resolvePath(remixFilepath, openapiLocation);
  for (const [name, server] of Object.entries(servers)) {
    if (server.type !== 'openapi') continue;
    if (resolvePath(remixFilepath, server.openapi) === absoluteLocation) {
      return { name, server };
    }
  }

  return null;
}

export default async function generateRemix(
  remix: {
    definition: RemixDefinition | null;
    filepath: string;
  },
  openapiLocation: string,
): Promise<RemixDefinition> {
  const document = await loadDocument({ fetch, fs }, openapiLocation);
  const service = parseAsService(document);
  const existingServer =
    remix.definition === null ? null : findExistingServer(remix.definition.servers, remix.filepath, openapiLocation);
  const name = existingServer?.name ?? (await negotiateName(slugify(service.name).slice(0, 24)));

  if (existingServer !== null) {
    console.info(`Given openmcp definition already contains ${JSON.stringify(name)} server.`);
  }

  const tools = await prompt.multiselect({
    message: 'Please select tools you want to include:',
    options: listTools(document).map(({ name, route }) => ({
      label: name,
      hint: route,
      value: name,
    })),
    initialValues: existingServer?.server.tools,
  });
  tools.sort((a, b) => a.localeCompare(b));

  if (existingServer?.server) {
    Object.assign(existingServer.server, {
      tools,
    });
    return remix.definition!;
  }

  const serverUrl = await negotiateServerUrl(service);
  const serverClientConfig: Pick<OpenAPIServer, 'path' | 'query' | 'headers' | 'body'> = {};
  const config: Record<string, unknown> = {};

  try {
    const { serverClientConfig: _serverClientConfig, userConfig: _config } = await negotiateSecurityStrategy(
      {
        generateConfigKey(key) {
          return screamCase([name, key].filter(Boolean).join(' '));
        },
      },
      service,
    );
    Object.assign(config, _config);
    Object.assign(serverClientConfig, _serverClientConfig);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }

  const definition = remix.definition ?? {
    configs: {},
    servers: {},
  };

  const server: OpenAPIServer = {
    type: 'openapi',
    openapi: resolveOpenAPIPath(remix.filepath, openapiLocation),
    serverUrl,
    ...serverClientConfig,
    tools,
  };

  definition.configs[name] = config;
  definition.servers[name] = server;

  return definition;
}

async function negotiateName(defaultName: string): Promise<string> {
  const name = await prompt.text({
    message: 'Please insert a name for your server:',
    placeholder: defaultName,
    validate: value => {
      const slug = slugify(value);
      if (slug.length < 1 || slug.length > 24) {
        return 'Name must be between 1 and 24 characters long';
      }
    },
  });

  return name.length === 0 ? defaultName : slugify(name);
}

function resolvePath(remixFilepath: string, location: string): string {
  if (URL.canParse(location)) return location;
  if (path.isAbsolute(location)) return location;
  return path.join(path.dirname(remixFilepath), location);
}

function resolveOpenAPIPath(remixFilepath: string, location: string): string {
  if (URL.canParse(location)) return location;

  return path.relative(path.dirname(remixFilepath), location);
}
