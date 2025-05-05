import { serializeDocument } from '@openmcp/utils/documents';

export const configYaml = serializeDocument(
  {
    extensions: {
      'test-server': {
        args: ['-y', 'openmcp@latest', 'run', '--server', 'ag_abc123de'],
        bundled: null,
        cmd: 'npx',
        description: null,
        enabled: true,
        env_keys: [],
        envs: {},
        name: 'Test Server',
        timeout: 300,
        type: 'stdio',
      },
    },
  },
  'yaml',
);

export const emptyConfigYaml = serializeDocument(
  {
    extensions: {},
  },
  'yaml',
);

export const invalidConfigYaml = serializeDocument(
  {
    extensions: {
      'test-server': {
        args: ['-y', 'openmcp@latest', 'run', '--server', 'ag_abc123de'],
        bundled: null,
        cmd: 'invalid-command', // Not 'npx', so it won't match SERVER_SCHEMA
        description: null,
        enabled: true,
        env_keys: [],
        envs: {},
        name: 'Test Server',
        timeout: 300,
        type: 'stdio',
      },
      'valid-server': {
        args: ['-y', 'openmcp@latest', 'run', '--server', 'ag_xyz789'],
        bundled: null,
        cmd: 'npx',
        description: null,
        enabled: true,
        env_keys: [],
        envs: {},
        name: 'Valid Server',
        timeout: 300,
        type: 'stdio',
      },
    },
  },
  'yaml',
);
