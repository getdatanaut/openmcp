export const settingsJson = JSON.stringify(
  {
    mcp: {
      servers: {
        'test-server': {
          type: 'stdio',
          command: 'npx',
          args: ['-y', 'openmcp@1', 'run', '--server', 'ag_abc123de'],
        },
      },
    },
  },
  null,
  2,
);

export const emptySettingsJson = JSON.stringify(
  {
    mcp: {
      servers: {},
    },
  },
  null,
  2,
);

export const mcpJson = JSON.stringify(
  {
    servers: {
      'test-server': {
        type: 'stdio',
        command: 'npx',
        args: ['-y', 'openmcp@1', 'run', '--server', 'ag_abc123de'],
      },
    },
  },
  null,
  2,
);

export const emptyMcpJson = JSON.stringify(
  {
    servers: {},
  },
  null,
  2,
);
