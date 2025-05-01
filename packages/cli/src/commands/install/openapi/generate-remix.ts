import type { Config as RemixDefinition, OpenAPIServer } from '@openmcp/remix';

import console, { prompt } from '#libs/console';
import { loadDocumentAsService, negotiateSecurityStrategy, negotiateServerUrl } from '#libs/openapi';

import { camelCase, screamCase, slugify } from '../../../utils/string.ts';

export default async function generateRemix(
  filepath: string,
): Promise<{ id: string; name: string; definition: RemixDefinition }> {
  const service = await loadDocumentAsService(filepath);
  const name = slugify(
    await prompt.text({
      message: 'Please insert a name for your server:',
      placeholder: slugify(service.name),
      validate: value => {
        const slug = slugify(value);
        if (slug.length < 1 || slug.length > 24) {
          return 'Name must be between 1 and 24 characters long';
        }
      },
    }),
  );

  const serverUrl = await negotiateServerUrl(service);
  const serverClientConfig: OpenAPIServer['clientConfig'] = {};
  const config: Record<string, unknown> = {};

  try {
    const { serverClientConfig: _serverClientConfig, userConfig: _config } = await negotiateSecurityStrategy(
      {
        generateConfigKey: camelCase,
        generateConfigValue: key => '$' + screamCase([name, key].filter(Boolean).join(' ')),
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
    serverConfig: {
      openapi: filepath,
      serverUrl,
    },
    clientConfig: serverClientConfig,
  };

  return {
    id: filepath,
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
