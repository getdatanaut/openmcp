# @openmcp/cloudflare

Cloudflare DurableObject adapter for OpenMCP servers.

## Usage

### Create your own MCP Server

```ts
import { OpenMcpDurableObject, routeOpenMcpRequest } from '@openmcp/cloudflare';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export class HelloWorldMcpServer extends OpenMcpDurableObject {
  override readonly mcpServerId = 'hello-world';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  override createMcpServer() {
    const server = new McpServer(
      {
        name: 'Hello World',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    server.tool('hello', () => {
      return { content: [{ type: 'text', text: 'Hello World!' }] };
    });

    return server;
  }
}

export default {
  async fetch(request, env) {
    return routeOpenMcpRequest(request, {
      'hello-world': {
        namespace: env.HELLO_WORLD_MCP_SERVER,
      },
    });
  },
};
```

### Extend the OpenAPI MCP Server

```ts
import { OpenMcpOpenAPI } from '@openmcp/cloudflare';

export class PetstoreApi extends OpenMcpOpenAPI {
  override mcpServerId = 'petstore';

  override config = {
    openapi: 'https://petstore3.swagger.io/api/v3/openapi.json',
    baseUrl: 'https://petstore3.swagger.io/api/v3',
  };
}

export default {
  async fetch(request, env) {
    return routeOpenMcpRequest(request, {
      petstore: {
        namespace: env.PETSTORE_MCP_SERVER,
      },
    });
  },
};
```
