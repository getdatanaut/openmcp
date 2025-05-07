import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { loadDocument } from '@openmcp/utils/documents';

import console from '#libs/console';
import * as prompt from '#libs/console/prompts';
import { listTools, negotiateSecurityStrategy, negotiateServerUrl, parseAsService } from '#libs/openapi';
import type { Config as RemixDefinition, OpenAPIServer } from '#libs/remix';
import { screamCase, slugify } from '#libs/string-utils';

export default async function generateRemix(
  cwd: string,
  location: string,
): Promise<{ id: string; name: string; definition: RemixDefinition }> {
  const document = await loadDocument({ fetch, fs }, location);
  const service = parseAsService(document);
  const defaultName = slugify(service.name).slice(0, 24);
  const name =
    slugify(
      await prompt.text({
        message: 'Please insert a name for your server:',
        placeholder: defaultName,
        validate: value => {
          const slug = slugify(value);
          if (slug.length < 1 || slug.length > 24) {
            return 'Name must be between 1 and 24 characters long';
          }
        },
      }),
    ) || defaultName;

  const serverUrl = await negotiateServerUrl(service);
  const serverClientConfig: Pick<OpenAPIServer, 'path' | 'query' | 'headers' | 'body'> = {};
  const config: Record<string, unknown> = {};

  const tools = await prompt.multiselect({
    message: 'Please select tools you want to include:',
    options: listTools(document).map(({ name, route }) => ({
      label: name,
      hint: route,
      value: name,
    })),
  });
  tools.sort((a, b) => a.localeCompare(b));

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

  const server: OpenAPIServer = {
    type: 'openapi',
    openapi: location,
    serverUrl,
    ...serverClientConfig,
    tools,
  };

  return {
    id: URL.canParse(location) ? location : `file://${path.resolve(cwd, location)}`,
    name,
    definition: {
      configs: {
        [name]: config,
      },
      servers: {
        [name]: server,
      },
    },
  };
}
