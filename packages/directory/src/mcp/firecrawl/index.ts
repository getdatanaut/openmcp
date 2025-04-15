import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_firecrawl',
  name: 'Firecrawl',
  version: '1.0.0',
  transport: {
    type: 'streamableHttp',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/stream?openapi=https://raw.githubusercontent.com/mendableai/firecrawl/refs/heads/main/apps/api/v1-openapi.json&baseUrl=https://api.firecrawl.dev/v1',
      requestInit: {
        headers: {
          'x-openmcp': '{"headers":{"Authorization":"Bearer {{apiKey}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'web scraping',
    developer: 'Datanaut',
    icon: {
      light: 'https://www.firecrawl.dev/favicon.ico',
      dark: 'https://www.firecrawl.dev/favicon.ico',
    },
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/firecrawl',
  },
  configSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description:
          'API key for your Firecrawl account. https://docs.firecrawl.dev/api-reference/introduction#authentication',
        format: 'secret',
        title: 'API Key',
      },
    },
    required: ['apiKey'],
  },
} as const satisfies ServerStorageData;
