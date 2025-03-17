import type { ServerStorageData } from '@openmcp/manager';

// @TODO delete this file when done w mocks

export const generateMockServers = () => {
  return [
    {
      id: 'srv_petstore',
      name: 'Petstore',
      version: '1.0.0',
      transport: {
        type: 'sse',
        config: {
          url: 'http://localhost:8787/mcp/openapi/sse?openapi=https://petstore3.swagger.io/api/v3/openapi.json&baseUrl=https://petstore3.swagger.io/api/v3',
        },
      },
      presentation: {
        category: 'fun',
        developer: 'Datanaut',
        sourceUrl: 'https://github.com/getdatanaut/openmcp',
      },
      configSchema: {},
    },
    {
      id: 'srv_pokemon',
      name: 'Pokemon',
      version: '1.0.0',
      transport: {
        type: 'sse',
        config: {
          url: 'http://localhost:8787/mcp/openapi/sse?openapi=https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/openapi.yml&baseUrl=https://pokeapi.co/api/v2',
        },
      },
      presentation: {
        category: 'fun',
        developer: 'Datanaut',
        sourceUrl: 'https://github.com/getdatanaut/openmcp',
      },
      configSchema: {},
    },
  ] as const satisfies ServerStorageData[];
};

// export const generateMockServers = () => {
//   return [
//     {
//       id: 'srv_stripe',
//       name: 'Stripe',
//       category: 'finance',
//       requiresAuth: true,
//       developer: 'Stripe',
//       sourceUrl: 'https://github.com/stripe/stripe-mcp',
//       icon: {
//         light: '/logos/stripe.svg',
//         dark: '/logos/stripe.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_github',
//       name: 'Github',
//       category: 'developer',
//       requiresAuth: true,
//       developer: 'MCP',
//       sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
//       icon: {
//         dark: '/logos/github-dark.svg',
//         light: '/logos/github-light.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_fetch',
//       name: 'Fetch',
//       category: 'utilities',
//       requiresAuth: false,
//       developer: 'MCP',
//       sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
//       icon: {
//         dark: '/logos/fetch-dark.svg',
//         light: '/logos/fetch-light.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_memory',
//       name: 'Memory',
//       category: 'utilities',
//       requiresAuth: false,
//       developer: 'MCP',
//       sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
//       icon: {
//         dark: '/logos/memory-dark.svg',
//         light: '/logos/memory-light.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_linear',
//       name: 'Linear',
//       category: 'productivity',
//       requiresAuth: true,
//       developer: 'Linear',
//       sourceUrl: 'https://github.com/vinayak-mehta/linear-mcp',
//       icon: {
//         dark: '/logos/linear-light.svg',
//         light: '/logos/linear-dark.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_slack',
//       name: 'Slack',
//       category: 'communication',
//       requiresAuth: true,
//       developer: 'Slack',
//       sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
//       icon: {
//         dark: '/logos/slack.svg',
//         light: '/logos/slack.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_obsidian',
//       name: 'Obsidian',
//       category: 'productivity',
//       requiresAuth: true,
//       developer: 'Markus Pfundstein',
//       sourceUrl: 'https://github.com/MarkusPfundstein/mcp-obsidian',
//       icon: {
//         dark: '/logos/obsidian.svg',
//         light: '/logos/obsidian.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_rember',
//       name: 'Rember',
//       category: 'productivity',
//       requiresAuth: true,
//       developer: 'Rember',
//       sourceUrl: 'https://github.com/rember/rember-mcp',
//       icon: {
//         dark: '/logos/rember.png',
//         light: '/logos/rember.png',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_browser',
//       name: 'Browser',
//       category: 'utilities',
//       requiresAuth: false,
//       developer: 'Google LLC',
//       sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
//       icon: {
//         dark: '/logos/browser-dark.svg',
//         light: '/logos/browser-light.svg',
//       },
//       transport: {},
//     },
//     {
//       id: 'srv_hn',
//       name: 'Hacker News',
//       category: 'social',
//       requiresAuth: false,
//       developer: 'Y Combinator',
//       sourceUrl: 'https://github.com/erithwik/mcp-hn',
//       icon: {
//         dark: '/logos/yc.svg',
//         light: '/logos/yc.svg',
//       },
//       transport: {},
//     },
//   ] satisfies McpServerConfig[];
// };
