import { serializeDocument } from '@openmcp/utils/documents';

export const configYaml = serializeDocument(
  {
    mcpServers: {
      'test-server': {
        command: 'npx',
        args: ['-y', 'openmcp@1', 'run', '--server', 'ag_abc123de'],
      },
    },
  },
  'yaml',
);

export const emptyConfigYaml = serializeDocument(
  {
    mcpServers: {},
  },
  'yaml',
);

export const invalidConfigYaml = serializeDocument(
  {
    mcpServers: {
      'test-server': {
        command: 'invalid-command', // Not 'npx', so it won't match SERVER_SCHEMA
        args: ['-y', 'openmcp@1', 'run', '--server', 'ag_abc123de'],
      },
      'valid-server': {
        command: 'npx',
        args: ['-y', 'openmcp@1', 'run', '--server', 'ag_xyz789'],
      },
    },
  },
  'yaml',
);
