import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_gmail',
  name: 'Gmail',
  version: '1.0.0',
  transport: {
    type: 'sse',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/sse?openapi=https://datanaut.ai/api/directory/gmail/openapi.json&baseUrl=https://gmail.googleapis.com/gmail/v1',
      requestInit: {
        headers: {
          'x-openmcp': '{"headers":{"Authorization":"Bearer {{gmailApiKey}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'email',
    developer: 'Datanaut',
    icon: {
      light: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
      dark: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    },
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/gmail',
  },
  configSchema: {
    type: 'object',
    properties: {
      gmailApiKey: {
        type: 'string',
        description: 'Google Cloud API Key. https://developers.google.com/workspace/guides/create-credentials',
        format: 'secret',
        title: 'Google Cloud API Key',
      },
    },
    required: ['gmailApiKey'],
  },
} as const satisfies ServerStorageData;
