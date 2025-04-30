import type { Config as RemixDefinition, OpenAPIServer } from '@openmcp/remix';

import console, { prompt } from '#libs/console';
import { loadDocumentAsService, negotiateSecurityStrategy, negotiateServerUrl } from '#libs/openapi';

import { camelCase, replaceWhitespaces, screamCase } from '../../../utils/string.ts';

export default async function generateRemix(
  filepath: string,
): Promise<{ id: string; name: string; definition: RemixDefinition }> {
  const service = await loadDocumentAsService(filepath);
  const name = replaceWhitespaces(
    (
      await prompt.text({
        message: 'Please insert a name for your server:',
        placeholder: replaceWhitespaces(service.name, '_').slice(0, 24),
        validate: value => {
          const trimmedValue = value.trim();
          if (trimmedValue.length === 0) {
            return 'Name cannot be empty';
          }

          if (replaceWhitespaces(trimmedValue, '_').length > 24) {
            return 'Name cannot be longer than 24 characters';
          }
        },
      })
    ).trim(),
    '_',
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
