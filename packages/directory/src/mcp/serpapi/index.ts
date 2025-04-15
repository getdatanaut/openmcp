import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_serpapi',
  name: 'SerpAPI',
  version: '1.0.0',
  transport: {
    type: 'streamableHttp',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/stream?openapi=https://datanaut.ai/api/directory/serpapi/openapi.json&baseUrl=https://serpapi.com',
      requestInit: {
        headers: {
          'x-openmcp': '{"query":{"api_key":"{{apiKey}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'search',
    developer: 'Datanaut',
    icon: {
      light: 'https://www.serpapi.com/favicon.ico',
      dark: 'https://www.serpapi.com/favicon.ico',
    },
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/serpapi',
  },
  configSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'API key for your SerpAPI account. https://serpapi.com/dashboard',
        format: 'secret',
        title: 'API Key',
      },
    },
    required: ['apiKey'],
  },
} as const satisfies ServerStorageData;
