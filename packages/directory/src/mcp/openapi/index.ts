import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_openapi',
  name: 'OpenAPI',
  version: '1.0.0',
  transport: {
    type: 'streamableHttp',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/stream?openapi={{openapi}}&baseUrl={{baseUrl}}',
      requestInit: {
        headers: {
          'x-openmcp': '{"query": {{query}}, "headers": {{headers}}}',
        },
      },
    },
  },
  presentation: {
    category: 'developer',
    developer: 'Datanaut',
    icon: {
      light: 'https://www.openapis.org/favicon.ico',
      dark: 'https://www.openapis.org/favicon.ico',
    },
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/openapi',
  },
  configSchema: {
    type: 'object',
    properties: {
      openapi: {
        type: 'string',
        description: 'URL to the OpenAPI spec (eg. https://petstore.swagger.io/v2/swagger.json)',
      },
      baseUrl: {
        type: 'string',
        description: 'Base URL for API (eg. https://slack.com/api)',
      },
      query: {
        type: 'string',
        description: 'Query parameters to be added to each tool call request (eg. {"api_key":"1234567890"}',
        default: '{}',
      },
      headers: {
        type: 'string',
        description: 'Headers to be added to each tool call request (eg. {"Authorization":"Bearer 1234567890"}',
        default: '{}',
      },
    },
    required: ['openapi', 'baseUrl'],
  },
} as const satisfies ServerStorageData;
