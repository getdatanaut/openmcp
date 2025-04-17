import path from 'node:path';

import type { Argv, CommandBuilder, CommandModule } from 'yargs';

import handler from './handler.ts';
import type { ServerDefinition } from './types.ts';

function parsePairs(pairs: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const split = pair
      .split(':')
      .map(s => s.trim())
      .filter(Boolean);

    if (split.length !== 2) {
      throw new Error(`Invalid header format: ${pair}. Expected format: "key:value"`);
    }
    const [key, value] = split as [string, string];
    result[key] = value;
  }
  return result;
}

function isPopulated(input: unknown): input is [string, ...string[]] {
  return Array.isArray(input) && input.length > 0;
}

const builder: CommandBuilder<{}, ServerDefinition> = yargs =>
  yargs
    .parserConfiguration({ 'populate--': true })
    .strict()
    // .example('$0 upload --type stdio -- npx -y @modelcontextprotocol/server-filesystem /tmp', 'Upload STDIO MCP server')
    // .example('$0 upload --type sse -- http://localhost:3000/sse', 'Upload SSE MCP server')
    // .example('$0 upload --type streamable-http -- http://localhost:3000/mcp', 'Upload streamable HTTP MCP server')
    // .example('$0 upload --type openapi -- ./openapi.v3.yaml', 'Upload OpenAPI MCP server')
    .options({
      type: {
        choices: ['stdio', 'sse', 'streamable-http', 'openapi'] as const,
        description: 'Type of the MCP Server',
        demandOption: true,
      },
      developer: {
        type: 'string',
        description: 'Developer of the server',
      },
      iconUrl: {
        type: 'string',
        description: 'Icon URL of the server',
      },
      sourceUrl: {
        type: 'string',
        description: 'Source URL of the server',
      },
      serverUrl: {
        type: 'string',
        description: 'Server URL of the OpenAPI server',
      },
      headers: {
        type: 'array',
        describe:
          "A key:value header pairs to send with the requests to SSE / StreamableHttp MCP server instance. This is primarily meant to be used to set the Authorization header. It's best combined with config",
        default: [],
        group: 'StreamableHttp/SSE Client Configuration',
        coerce: parsePairs,
      },
    })
    .middleware(argv => {
      const source = argv['--'];
      if (!isPopulated(source)) {
        throw new Error('Missing URL or command.');
      }

      if (argv.type === 'stdio') {
        const validIdentifier = /^(?!-)[A-Za-z0-9_-]+$/;
        argv['input'] = source
          .map(argv => {
            if (argv.startsWith('-')) {
              return argv;
            }

            if (validIdentifier.test(argv)) {
              return argv;
            }

            return JSON.stringify(argv);
          })
          .join(' ');
        return;
      }

      if (source.length > 1) {
        throw new Error(argv.type === 'openapi' ? 'Only one URL or file path is allowed.' : 'Only one URL is allowed.');
      }

      switch (argv.type) {
        case 'sse':
        case 'streamable-http':
          argv['url'] = new URL(source[0]);
          break;
        case 'openapi': {
          const uri = source[0];
          if (!URL.canParse(uri) && !path.isAbsolute(uri)) {
            argv['uri'] = path.join(process.cwd(), uri);
          } else {
            argv['uri'] = uri;
          }
          break;
        }
      }
    }) as unknown as Argv<ServerDefinition>;

export default {
  command: 'upload',
  builder,
  describe: 'Upload an mpc server',
  // describe: false, // Hides the command from the help output
  handler,
} satisfies CommandModule<{}, ServerDefinition>;
