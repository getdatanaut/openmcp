import { describe, expect, it } from 'vitest';

import parseDockerRun from '../parse-docker-run.ts';

const cases = [
  [
    'docker run nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [{ type: 'positional', raw: 'nginx', value: 'nginx' }],
      vars: new Set(),
    },
  ],
  [
    'docker run -it ubuntu bash',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'i', raw: 'true', value: 'true' },
        { type: 'flag', name: 't', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
        { type: 'positional', raw: 'bash', value: 'bash' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run -d nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'flag', name: 'd', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run -p 8080:80 nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'flag', name: 'p', raw: '8080:80', value: '8080:80' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run -e ENV_VAR_NAME=value ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        {
          type: 'flag',
          name: 'e',
          raw: 'ENV_VAR_NAME=value',
          value: 'ENV_VAR_NAME={{ENV_VAR_NAME}}',
        },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(['ENV_VAR_NAME']),
    },
  ],
  [
    'docker run -v /host/path:/container/path ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'v', raw: '/host/path:/container/path', value: '/host/path:/container/path' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --memory=512m ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'memory', raw: '512m', value: '512m' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --name my_container ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'name', raw: 'my_container', value: 'my_container' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --rm ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'rm', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --network=my_network nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'flag', name: 'network', raw: 'my_network', value: 'my_network' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run -u 1000:1000 ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'u', raw: '1000:1000', value: '1000:1000' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --restart=always nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'flag', name: 'restart', raw: 'always', value: 'always' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --hostname=myhost ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'hostname', raw: 'myhost', value: 'myhost' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --cpus=1.5 ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'cpus', raw: '1.5', value: '1.5' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --entrypoint /bin/sh ubuntu',
    {
      command: 'docker',
      externalId: 'ubuntu',
      args: [
        { type: 'flag', name: 'entrypoint', raw: '/bin/sh', value: '/bin/sh' },
        { type: 'positional', raw: 'ubuntu', value: 'ubuntu' },
      ],
      vars: new Set(),
    },
  ],
  [
    'docker run --read-only nginx',
    {
      command: 'docker',
      externalId: 'nginx',
      args: [
        { type: 'flag', name: 'read-only', raw: 'true', value: 'true' },
        { type: 'positional', raw: 'nginx', value: 'nginx' },
      ],
      vars: new Set(),
    },
  ],
  [
    [
      'docker',
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
      vars: new Set(),
    },
  ],
  [
    'docker run -i --rm --init -e DOCKER_CONTAINER=true mcp/puppeteer',
    {
      command: 'docker',
      externalId: 'mcp/puppeteer',
      args: [
        { type: 'flag', name: 'i', raw: 'true', value: 'true' },
        { type: 'flag', name: 'rm', raw: 'true', value: 'true' },
        { type: 'flag', name: 'init', raw: 'true', value: 'true' },
        { type: 'flag', name: 'e', raw: 'DOCKER_CONTAINER=true', value: 'DOCKER_CONTAINER=true' },
        { type: 'positional', raw: 'mcp/puppeteer', value: 'mcp/puppeteer' },
      ],
      vars: new Set(),
    },
  ],
] as const;

describe('parseDockerRun', () => {
  it.each(cases)('should parse command: %s', (input, expected) => {
    const parsed = parseDockerRun(input);
    expect(parsed).toStrictEqual(expected);
  });
});
