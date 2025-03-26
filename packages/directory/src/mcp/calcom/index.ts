import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_calcom',
  name: 'Cal.com',
  version: '1.0.0',
  transport: {
    type: 'sse',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/sse?openapi=https://raw.githubusercontent.com/calcom/cal.com/122af4538d6b293090c8ab8a6a63a96b059c770f/docs/api-reference/v2/openapi.json&baseUrl=https://api.cal.com',
      requestInit: {
        headers: {
          'x-openmcp': '{"headers":{"Authorization":"Bearer {{calcomApiKey}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'calendar',
    developer: 'Datanaut',
    icon: {
      light: 'https://www.cal.com/favicon.ico',
      dark: 'https://www.cal.com/favicon.ico',
    },
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/calcom',
  },
  configSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'API key for your Cal.com account. https://cal.com/docs/api-reference/v2/introduction#1-api-key',
        format: 'secret',
      },
    },
    required: ['calcomApiKey'],
  },
} as const satisfies ServerStorageData;
