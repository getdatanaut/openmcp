# OpenMpc

OpenMpc is a toolkit for working with the Model Context Protocol (MCP), providing a suite of packages to build, connect,
and manage MCP servers and clients.

## Packages

### [@openmcp/manager](packages/manager)

OpenMpc manager effectly acts as a "host" application, and makes it easy to manage configuration, connections, and tool
calling between many MPC clients and many MPC servers.

It is runtime agnostic, and works in the browser, node, and edge environments such as Cloudflare.

<details>
<summary>Adding clients + servers and handling messages</summary>

```ts
import { createMpcManager, createMpcConductor } from '@openmcp/manager';

/**
 * Create a manager, by default it will store everything in memory.
 */
const manager = createMpcManager();

/**
 * The conductor is handles messages and coordinates client<->server tool calling.
 */
const conductor = createMpcConductor({
  toolsByClientId: manager.current.clientServers.toolsByClientId,
  // Optional, will pull the openai key from the OPENAI_API_KEY env variable if not supplied here
  settings: {
    providers: {
      openai: { apiKey: 'your-key' },
    },
  },
});

/**
 * Send a message, get back a `@ai-sdk` response stream.
 * Nothing special happening yet since we have not configured anything on our manager.
 */
const res = await conductor.handleMessage({
  // clientId can be anything, but often it will be your user's id
  clientId: 'user-1',
  message: 'What tools do I have available?',
});

// Add a server configuration to the manager
await manager.servers.create({
  id: 'test-server-id',
  name: 'Test Server',

  // A JSON schema describing the config that clients are expected to provide
  configSchema: {
    properties: {
      apiKey: { type: 'string' },
    },
    required: ['apiKey'],
  },

  transport: {
    type: 'sse',
    config: {
      url: 'http://localhost:3000/sse',
      // Optionally configure request defaults, with variable substitution from client config
      // These will be sent along with every tool call to this server
      requestInit: {
        headers: {
          Authorization: 'Bearer {{apiKey}}',
        },
      },
    },
  },
});

// Add a client <-> server configuration
const clientServer1 = await manager.clientServers.create({
  clientId: 'user-1',
  serverid: 'test-server-id',
  serverConfig: {
    apiKey: '12345',
  },
});

// Now when handleMessage is called for user-1, tools that servers
// this client has configured will be made available and used to produce the response
const res2 = await conductor.handleMessage({
  clientId: 'user-1',
  message: 'What tools do I have available?',
});

/** Some other helpful methods: **/

// Will request and list tools from the connected server
const tools = await clientServer1.listTools();

// Call a tool on the server, on behalf of the user-1 client. This will include
// a `Authorization: "Bearer 12345"` in the request.
await clientServer1.callTool({ name: 'tool1', input: {} });

// List tools from all servers that the user-1 client has configured
const allTools = await manager.clientServers.toolsByClientId({ clientId: 'user-1' });
```

</details>

<details>
<summary>Providing your own custom storage</summary>

By default manager will load and store client server configs, and server configs, in memory. Often, this information
will be stored in a database. To support this, OpenMpc manager supports custom storage:

```ts
const manager = createMpcManager({
  storage: {
    servers: {
      insert: async row => {
        await myDb.clientServers.add(row);
      },
      upsert: async ({ id }, row) => {
        await myDb.clientServers.put({ ...row, id });
      },
      update: async ({ id }, row) => {
        await myDb.clientServers.update(id, row);
      },
      delete: async ({ id }) => {
        await myDb.clientServers.delete(id);
      },
      // `where` will only ever be a simple object
      findMany: async where => {
        return myDb.clientServers.where(where);
      },
      getById: async ({ id }) => {
        return myDb.clientServers.get(id);
      },
    },

    clientServers: {
      // same interface and approach as servers
    },
  },
});
```

</details>

### [@openmcp/cloudflare](packages/cloudflare)

Turn durable objects into mpc servers.

<details>
<summary>Create your own MCP Server</summary>

```ts
import { OpenMcpDurableObject, routeOpenMcpRequest } from '@openmcp/cloudflare';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 1. Define the durable object
export class HelloWorldMcpServer extends OpenMcpDurableObject {
  override readonly mcpServerId = 'my-hello-world-mpc';

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

// 2. In your cloudflare worker
export default {
  async fetch(request, env) {
    return routeOpenMcpRequest(request, {
      'my-hello-world-mpc': {
        namespace: env.HELLO_WORLD_MCP_SERVER,
      },
    });
  },
};
```

</details>

<details>
<summary>Turn any OpenAPI specification into an MCP Server</summary>

```ts
import { OpenMcpOpenAPI, routeOpenMcpRequest } from '@openmcp/cloudflare';

// 1. Define the durable object
export class PetstoreApi extends OpenMcpOpenAPI {
  override mcpServerId = 'my-petstore-mpc';

  override config = {
    // URL to the specification file
    openapi: 'https://petstore3.swagger.io/api/v3/openapi.json',

    // The base url of the API itself
    baseUrl: 'https://petstore3.swagger.io/api/v3',
  };
}

// 2. In your cloudflare worker
export default {
  async fetch(request, env) {
    return routeOpenMcpRequest(request, {
      'my-petstore-mpc': {
        namespace: env.PETSTORE_MCP_SERVER,
      },
    });
  },
};
```

</details>
