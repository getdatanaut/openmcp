import { describe, expect, it } from 'vitest';

import ConfigSchema from '../../config-schema.ts';
import parseDockerRun from '../parse-docker-run.ts';

const cases = [
  [
    'run nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'command', value: 'run' },
        { type: 'positional', dataType: 'string', value: 'nginx', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run -it ubuntu bash',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'i', dataType: 'boolean', value: true },
        { type: 'flag', name: 't', dataType: 'boolean', value: true },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
        { type: 'positional', dataType: 'string', value: 'bash', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run -d nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'd', dataType: 'boolean', value: true },
        { type: 'positional', dataType: 'string', value: 'nginx', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run -p 8080:80 nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'p', dataType: 'string', value: '8080:80', masked: null },
        { type: 'positional', dataType: 'string', value: 'nginx', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run -e ENV_VAR_NAME=value ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        {
          type: 'flag',
          name: 'e',
          dataType: 'string',
          value: 'ENV_VAR_NAME=value',
          masked: 'ENV_VAR_NAME={{ENV_VAR_NAME}}',
        },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: {
        type: 'object',
        properties: {
          ENV_VAR_NAME: {
            type: 'string',
          },
        },
        required: ['ENV_VAR_NAME'],
      },
    },
  ],
  [
    'run -v /host/path:/container/path ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'v', dataType: 'string', value: '/host/path:/container/path', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'container run --memory=512m ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'container' },
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'memory', dataType: 'string', value: '512m', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --name my_container ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'name', dataType: 'string', value: 'my_container', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --rm ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'rm', dataType: 'boolean', value: true },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --network=my_network nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'network', dataType: 'string', value: 'my_network', masked: null },
        { type: 'positional', dataType: 'string', value: 'nginx', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run -u 1000:1000 ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'u', dataType: 'string', value: '1000:1000', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --restart=always nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'restart', dataType: 'string', value: 'always', masked: null },
        { type: 'positional', dataType: 'string', value: 'nginx', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --hostname=myhost ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'hostname', dataType: 'string', value: 'myhost', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --cpus=1.5 ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'cpus', dataType: 'number', value: '1.5', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --entrypoint /bin/sh ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'entrypoint', dataType: 'string', value: '/bin/sh', masked: null },
        { type: 'positional', dataType: 'string', value: 'ubuntu', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run --read-only nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'read-only', dataType: 'boolean', value: true },
        { type: 'positional', dataType: 'string', value: 'nginx', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    [
      'run',
      '--rm',
      '-i',
      '--mount',
      'type=bind,src=/Users/username/Desktop,dst=/projects/Desktop',
      '--mount',
      'type=bind,src=/path/to/other/allowed/dir,dst=/projects/other/allowed/dir,ro',
      '--mount',
      'type=bind,src=/path/to/file.txt,dst=/projects/path/to/file.txt',
      'mcp/git',
    ].join(' '),
    {
      command: 'docker',
      externalId: 'mcp/git',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'rm', dataType: 'boolean', value: true },
        { type: 'flag', name: 'i', dataType: 'boolean', value: true },
        {
          type: 'flag',
          name: 'mount',
          dataType: 'string',
          value: 'type=bind,src=/Users/username/Desktop,dst=/projects/Desktop',
          masked: null,
        },
        {
          type: 'flag',
          name: 'mount',
          dataType: 'string',
          value: 'type=bind,src=/path/to/other/allowed/dir,dst=/projects/other/allowed/dir,ro',
          masked: null,
        },
        {
          type: 'flag',
          name: 'mount',
          dataType: 'string',
          value: 'type=bind,src=/path/to/file.txt,dst=/projects/path/to/file.txt',
          masked: null,
        },
        { type: 'positional', dataType: 'string', value: 'mcp/git', masked: null },
      ],
      configSchema: undefined,
    },
  ],
  [
    'run -i --rm --init -e DOCKER_CONTAINER=true mcp/puppeteer',
    {
      command: 'docker',
      externalId: 'mcp/puppeteer',
      args: [
        { type: 'command', value: 'run' },
        { type: 'flag', name: 'i', dataType: 'boolean', value: true },
        { type: 'flag', name: 'rm', dataType: 'boolean', value: true },
        { type: 'flag', name: 'init', dataType: 'boolean', value: true },
        { type: 'flag', name: 'e', dataType: 'string', value: 'DOCKER_CONTAINER=true', masked: 'DOCKER_CONTAINER=true' },
        { type: 'positional', dataType: 'string', value: 'mcp/puppeteer', masked: null },
      ],
      configSchema: undefined,
    },
  ],
] as const;

describe('parseDockerRun', () => {
  it.each(cases)('should parse command: %s', (input, expected) => {
    const configSchema = new ConfigSchema();
    const parsed = parseDockerRun(configSchema, 'docker', input);
    expect(parsed).toStrictEqual({
      command: expected.command,
      args: expected.args,
      externalId: expected.externalId,
    });
    expect(configSchema.serialize()).toStrictEqual(expected.configSchema);
  });
});
