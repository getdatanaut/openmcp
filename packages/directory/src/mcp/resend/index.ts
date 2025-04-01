import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_resend',
  name: 'Resend',
  version: '1.0.0',
  transport: {
    type: 'sse',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/sse?openapi=https://raw.githubusercontent.com/resend/resend-openapi/refs/heads/main/resend.yaml&baseUrl=https://api.resend.com',
      requestInit: {
        headers: {
          'x-openmcp': '{"headers":{"Authorization":"Bearer {{apiKey}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'email',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/resend',
    icon: {
      light: 'https://www.resend.com/static/favicons/favicon.ico',
      dark: 'https://www.resend.com/static/favicons/favicon.ico',
    },
  },
  configSchema: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'API key for the Resend API. https://resend.com/docs/dashboard/api-keys/introduction#add-api-key',
        format: 'secret',
        title: 'API Key',
        example: 're_123456789',
      },
    },
    required: ['apiKey'],
  },
} as const satisfies ServerStorageData;
