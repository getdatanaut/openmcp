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
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      configSchema: null,
    },
  ],
  [
    'run -it ubuntu bash',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'i', raw: 'true', value: 'true' },
        { type: 'flag', name: 't', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
        { type: 'positional', raw: 'bash', value: 'bash' },
      ],
      configSchema: null,
    },
  ],
  [
    'run -d nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'd', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      configSchema: null,
    },
  ],
  [
    'run -p 8080:80 nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'p', raw: '8080:80', value: '8080:80' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      configSchema: null,
    },
  ],
  [
    'run -e ENV_VAR_NAME=value ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        {
          type: 'flag',
          name: 'e',
          raw: 'ENV_VAR_NAME=value',
          value: 'ENV_VAR_NAME={{ENV_VAR_NAME}}',
        },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
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
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'v', raw: '/host/path:/container/path', value: '/host/path:/container/path' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'container run --memory=512m ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'container', value: 'container' },
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'memory', raw: '512m', value: '512m' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --name my_container ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'name', raw: 'my_container', value: 'my_container' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --rm ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'rm', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --network=my_network nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'network', raw: 'my_network', value: 'my_network' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      configSchema: null,
    },
  ],
  [
    'run -u 1000:1000 ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'u', raw: '1000:1000', value: '1000:1000' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --restart=always nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'restart', raw: 'always', value: 'always' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --hostname=myhost ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'hostname', raw: 'myhost', value: 'myhost' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --cpus=1.5 ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'cpus', raw: '1.5', value: '1.5' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --entrypoint /bin/sh ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'entrypoint', raw: '/bin/sh', value: '/bin/sh' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      configSchema: null,
    },
  ],
  [
    'run --read-only nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'read-only', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      configSchema: null,
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
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'rm', raw: 'true', value: 'true' },
        { type: 'flag', name: 'i', raw: 'true', value: 'true' },
        {
          type: 'flag',
          name: 'mount',
          raw: 'type=bind,src=/Users/username/Desktop,dst=/projects/Desktop',
          value: 'type=bind,src=/Users/username/Desktop,dst=/projects/Desktop',
        },
        {
          type: 'flag',
          name: 'mount',
          raw: 'type=bind,src=/path/to/other/allowed/dir,dst=/projects/other/allowed/dir,ro',
          value: 'type=bind,src=/path/to/other/allowed/dir,dst=/projects/other/allowed/dir,ro',
        },
        {
          type: 'flag',
          name: 'mount',
          raw: 'type=bind,src=/path/to/file.txt,dst=/projects/path/to/file.txt',
          value: 'type=bind,src=/path/to/file.txt,dst=/projects/path/to/file.txt',
        },
        { type: 'positional', raw: 'mcp/git', value: 'mcp/git' },
      ],
      configSchema: null,
    },
  ],
  [
    'run -i --rm --init -e DOCKER_CONTAINER=true mcp/puppeteer',
    {
      command: 'docker',
      externalId: 'mcp/puppeteer',
      args: [
        { type: 'positional', raw: 'run', value: 'run' },
        { type: 'flag', name: 'i', raw: 'true', value: 'true' },
        { type: 'flag', name: 'rm', raw: 'true', value: 'true' },
        { type: 'flag', name: 'init', raw: 'true', value: 'true' },
        { type: 'flag', name: 'e', raw: 'DOCKER_CONTAINER=true', value: 'DOCKER_CONTAINER=true' },
        { type: 'positional', raw: 'mcp/puppeteer', value: 'mcp/puppeteer' },
      ],
      configSchema: null,
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
