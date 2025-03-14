# Server

## Development

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
http://localhost:8787/sse?openapi=https%3A%2F%2Fpetstore3.swagger.io%2Fapi%2Fv3%2Fopenapi.json&baseUrl=https%3A%2F%2Fpetstore3.swagger.io%2Fapi%2Fv3
```

Or in JavaScript:

```js
const url = new URL('http://localhost:8787/sse');
url.searchParams.set('openapi', 'https://petstore3.swagger.io/api/v3/openapi.json');
url.searchParams.set('baseUrl', 'https://petstore3.swagger.io/api/v3');

console.log(url.toString());
```
