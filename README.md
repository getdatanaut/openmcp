# OpenMCP

OpenMCP makes it easy to turn any OpenAPI specification into an MCP server, and to remix many MCP servers into a single
server with just the tools you need. It supports stdio and sse transports, and works with all of the major chat clients.

To get started, run this command:

```bash
npx -y openmcp install <url or file path to openapi specification> --client <chat client>
```

For example, to add the ability to query the weather from Cursor, you could run this:

```bash
# openmcp will prompt you for a security key since this api requires it - but the value can be any string
npx -y openmcp install https://api.weather.gov/openapi.json --client cursor
```

Running the install command will create an `openmcp.json` file for you, and add the openmcp server to your the mcp
config of your target (cursor, claude, etc). Running install again will update any existing `openmcp.json` file, if
present.

### openmcp.json format

The `openmcp.json` file describes the servers that should be started, auth configuration for each, and which tools you
want to expose for each server.

Bellow is a fully annotated example that mixes an openapi based server with a stdio server. Running openmcp with this
config would result in an mcp server with two tools - a tool to get the weather forecast, and a tool to make queries to
a local postgres database.

```jsonc
{
  // The configs object is a map of variable names to values. These variables can be referenced in the servers object below.
  // If a value is not set, openmcp will attempt to read from an environment variable of the same name.
  "configs": {
    "weather-gov-api": {
      "WEATHER_GOV_API_API_KEY": "foo",
    },

    "postgres": {
      // Or leave blank to read from the environment variable "POSTGRES_URL"
      "POSTGRES_URL": "postgresql://localhost/mydb",
    },
  },
  "servers": {
    // Example of an openapi server
    "weather-gov-api": {
      "type": "openapi",
      // The openapi specification can be a url or a local file path
      "openapi": "https://api.weather.gov/openapi.json",
      // The base url of the server
      "serverUrl": "https://api.weather.gov",
      // Optional headers to send with requests to the server. They can reference values from the configs object above.
      "headers": {
        "User-Agent": "{{WEATHER_GOV_API_API_KEY}}",
      },
      // Optional query parameters to send with requests to the server.
      "query": {},
      // The tools to expose for this server (by operationId). Leaving this empty will expose all tools.
      "tools": ["zone_forecast"],
    },

    // Example of a stdio server
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "{{POSTGRES_URL}}"],
      // The tools allowlist also works with stdio servers. In this case we only expose the relatively safe "query" tool.
      "tools": ["query"],
    },
  },
}
```

### Running the server

The install command will handle this for you, but if you'd like to run an openmcp server manually you can do so with
this command:

```bash
npx -y openmcp run --config <path to openmcp.json config>
```
