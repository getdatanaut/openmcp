import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_petstore',
  name: 'Petstore',
  version: '1.0.0',
  transport: {
    type: 'sse',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/sse?openapi=https://petstore3.swagger.io/api/v3/openapi.json&baseUrl=https://petstore3.swagger.io/api/v3',
    },
  },
  presentation: {
    description:
      'This is a sample server Petstore server. You can find out more about Swagger at http://swagger.io or on irc.freenode.net, #swagger. For this sample, you can use the api key `special-key` to test the authorization filters.',
    category: 'fun',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/petstore',
    icon: {
      light: 'https://www.petco.com/favicon.ico',
      dark: 'https://www.petco.com/favicon.ico',
    },
  },
  configSchema: {
    properties: {
      apiKey: {
        type: 'string',
        title: 'API Key',
        description: 'The API key for the MCP Server',
        format: 'secret',
      },
    },
    required: ['apiKey'],
  },
} as const satisfies ServerStorageData;
