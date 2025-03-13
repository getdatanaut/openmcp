# @openmcp/manager

Manage connections between MCP Servers and Clients through a single interface.

## How it works

- A `Manager` maintains a list of registered Servers, Clients, and the Connections between them.
- A `Server` defines a configuration schema and capabilities of an MCP Server that is available for Client connections.
- A `Client` configures, connects to, and calls tools provided by the MCP Servers.

## Example

```ts
import { createManager } from '@openmcp/manager';

// Create a manager
const manager = createManager({
  id: 'manager-id',
});

// Register MCP Server(s)
const server = manager.registerServer({
  id: 'datanaut',
  name: 'Datanaut MCP Server',
  version: '1.0.0',
  configSchema: z.object({
    apiKey: z.string(),
  }),
  capabilities: {
    tools: {},
  },
  transport: {
    type: 'sse',
    config: {
      url: 'https://api.datanaut.ai/sse',
    },
  },
});

// Connect a client to the server(s)
const client = await manager.connectClient({
  id: 'chris',
  servers: {
    datanaut: {
      apiKey: 'datanaut_api_key_123',
    },
  },
});

// Call tools
const result = await client.callTool({
  server: 'datanaut',
  name: 'captureEvents',
  input: {
    event: 'upsert_issue',
  },
});
```

## Usage

### Working with the Manager

```ts
import { createManager } from '@openmcp/manager';

/**
 * Create a new manager instance.
 */
const manager = createManager({
  id: 'manager-id',

  /**
   * Define transports to allow clients to connect to the manager.
   */
  transports: {
    sse: {
      url: 'http://localhost:3000/sse',
    },
  },

  // Optionally register servers during manager creation.
  // See `manager.registerServer()` below to register a servers
  // servers: {
  //   linear: {
  //     // See the config options in the example below
  //   }
  // }
});

/**
 * Register an MCP Server to allow clients connections to it.
 *
 * This method does not create a connection to the Server.
 *
 * Clients can configure the server using `manager.registerClient(clientConfig)` or `client.configureServer(config)` methods.
 *
 * Clients can connect to the server using `manager.connectClient(clientConfig)` or `client.connectServer(config)` methods.
 */
const server = manager.registerServer({
  id: 'linear',
  name: 'Linear MCP Server',

  /**
   * Define the configuration schema for the server.
   *
   * This is used to validate the configuration when a client connects.
   */
  configSchema: z.object({
    apiKey: z.string(),
  }),

  /**
   * Define the capabilities to expose from the server.
   *
   */
  capabilities: {
    tools: {
      createIssue: {
        description: 'Create a new issue',
        inputSchema: z.object({
          title: z.string(),
          description: z.string(),
          projectId: z.string(),
        }),
      },
    },
  },

  /**
   * Optionally create an MCP Server instance with the client provided configuration.
   *
   * This is called when a client connects to the server for the first time.
   */
  createServer: ({ config }) => {
    return new MCPServer(config);
  },
});

/**
 * Register a Client, and configure MCP Servers without connecting to them.
 *
 * Later, you can connect to the Servers using `manager.connectClient(clientConfig)` or `client.connectServer(serverId, config)`
 */
const client = manager.registerClient({
  id: 'chris',
  servers: {
    datanaut: {
      apiKey: 'datanaut_api_key_123',
    },
  },
});

/**
 * Register a Client, and connect to MCP Servers.
 *
 * Learn more in the [Working with Clients](#working-with-clients) section below.
 */
const client = await manager.connectClient({
  id: 'chris',
  servers: {
    datanaut: {
      apiKey: 'datanaut_api_key_123',
    },
  },
});

/**
 * Get all tools available from all registered servers.
 */
const tools = await manager.listTools();

/**
 * Get tools for specific servers
 */
const tools = await manager.listTools({
  servers: ['linear'],
});

/**
 * Get all servers registered with the manager.
 */
const servers = await manager.listServers();

/**
 * Get a specific server by id.
 *
 * Learn more in the [Working with Servers](#working-with-servers) section below.
 */
const server = await manager.getServer({ id: 'linear' });

/**
 * Get all clients connected to the manager.
 */
const clients = await manager.listClients();

/**
 * Get a specific client by id.
 *
 * Learn more in the [Working with Clients](#working-with-clients) section below.
 */
const client = await manager.getClient({ id: 'chris' });
```

### Working with Servers

```ts
/**
 * Access a server directly
 */
const server = manager.getServer({ id: 'linear' });

/**
 * Get tools available from the specific server.
 *
 * This returns definitions of the tools available from the server.
 */
const tools = await server.listTools();

/**
 * Get a tool from the server.
 *
 * This returns the tool definition from the server.
 */
const tool = await server.getTool({ name: 'createIssue' });

/**
 * Call a tool with a one-time configuration.
 */
const result = await server.callTool({
  name: 'createIssue',

  /**
   * Since a server connection is required to cal a tool,
   * we can provide a one-time configuration with this tool call.
   *
   * Under the hood the manager will create a new server connection, call the tool, and then destroy the server connection.
   */
  config: {
    apiKey: 'linear_api_secret_123',
  },

  input: {
    title: 'My first issue',
    description: 'This is a test issue',
    projectId: 'linear-project-123',
  },
});

/**
 * Get all clients connected to the server.
 */
const clients = await server.listClients();
```

### Working with Clients

```ts
/**
 * Configure an MCP Server without connecting to it.
 */
const configuredServer = await client.configureServer({
  id: 'linear',
  config: {
    apiKey: 'linear_api_secret_123',
  },
});
// Then connect to the MCP Server.
await configuredServer.connect();

/**
 * Or, configure and connect to an MCP Server in one step.
 */
await client.connectServer({
  id: 'linear',
  config: {
    apiKey: 'linear_api_secret_123',
  },
});

/**
 * Get MCP Servers configured by the client.
 */
const servers = await client.listServers();

/**
 * Get a specific MCP Server configured by the client.
 */
const server = await client.getServer({
  id: 'linear',
});

/**
 * Get tools available from all MCP Servers configured by the client.
 */
const tools = await client.listTools();

/**
 * Get tools available from specific MCP Servers.
 */
const tools = await client.listTools({
  servers: ['linear'],
});

/**
 * Get a specific tool by name.
 */
const tool = await client.getTool({
  name: 'createIssue',
});

/**
 * Call a tool on the server.
 */
const issues = await client.callTool({
  name: 'createIssue',
  input: {
    title: 'My first issue',
    description: 'This is a test issue',
    projectId: '123',
  },
});

/**
 * Disconnect a client from the manager and all connected servers.
 */
await client.disconnect();
```
