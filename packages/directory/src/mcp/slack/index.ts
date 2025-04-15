import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_slack',
  name: 'Slack',
  version: '1.0.0',
  transport: {
    type: 'streamableHttp',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/stream?openapi=https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json&baseUrl=https://slack.com/api',
      requestInit: {
        headers: {
          'x-openmcp': '{"headers":{"Authorization":"Bearer {{token}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'communication',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/slack',
    icon: {
      light: 'https://www.slack.com/favicon.ico',
      dark: 'https://www.slack.com/favicon.ico',
    },
  },
  configSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'OAuth token for the Slack API',
        format: 'secret',
        title: 'OAuth Token',
      },
    },
    required: ['token'],
  },
} as const satisfies ServerStorageData;
