import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_gcal',
  name: 'Google Calendar',
  version: '1.0.0',
  transport: {
    type: 'streamableHttp',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/stream?openapi=https://api.apis.guru/v2/specs/googleapis.com/calendar/v3/openapi.json&baseUrl=https://www.googleapis.com/calendar/v3',
      requestInit: {
        headers: {
          'x-openmcp': '{"headers":{"Authorization":"Bearer {{token}}"}}',
        },
      },
    },
  },
  presentation: {
    category: 'calendar',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/gcal',
    icon: {
      light: 'https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_31_256.ico',
      dark: 'https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_31_256.ico',
    },
  },
  configSchema: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        format: 'secret',
        title: 'Access Token',
        description: 'Access token for the Google API',
      },
      calendarId: {
        type: 'string',
        title: 'Calendar ID',
        description:
          'Open google calendar, and find your calendar on the left in the "My Calendars" section. Hover over, press the triple dot menu, and select "Settings and sharing". Scroll to the bottom and you will see the calendar ID, right under "Integrate calendar".',
      },
    },
    required: ['token', 'calendarId'],
  },
} as const satisfies ServerStorageData;
