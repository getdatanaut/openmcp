# Server

## Development

Create a `.dev.vars` file in the root of the project using `.dev.vars.example` as a template.

```
OPENAI_API_KEY=sk-proj-1234567890
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

Start the server in development mode:

```bash
yarn workspace server dev
```

Start MCP inspector:

```bash
npx -y @modelcontextprotocol/inspector
```

Load the server in the inspector:

```bash
http://localhost:8787/mcp/openapi/sse?openapi=https%3A%2F%2Fpetstore3.swagger.io%2Fapi%2Fv3%2Fopenapi.json&baseUrl=https%3A%2F%2Fpetstore3.swagger.io%2Fapi%2Fv3
```

Or in JavaScript:

```js
const url = new URL('http://localhost:8787/mcp/openapi/sse');
url.searchParams.set('openapi', 'https://petstore3.swagger.io/api/v3/openapi.json');
url.searchParams.set('baseUrl', 'https://petstore3.swagger.io/api/v3');

console.log(url.toString());
```

Make a request to the manager:

```bash
curl -X POST http://localhost:8787/manager/123/threads/456/messages \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "getPetById '1' from https://petstore3.swagger.io/api/v3/openapi.json at https://petstore3.swagger.io/api/v3" }]}'
```
