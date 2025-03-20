import type { ServerStorageData } from '@openmcp/manager';

export default {
  id: 'mcp_pokemon',
  name: 'Pokemon',
  version: '1.0.0',
  transport: {
    type: 'sse',
    config: {
      url: 'https://datanaut.ai/api/mcp/openapi/sse?openapi=https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/openapi.yml&baseUrl=https://pokeapi.co/api/v2',
    },
  },
  presentation: {
    description:
      "All the Pokémon data you'll ever need in one place, easily accessible through a modern free open-source `RESTful API`.",
    category: 'fun',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/pokemon',
    icon: {
      light: 'https://www.pokemon.com/favicon.ico',
      dark: 'https://www.pokemon.com/favicon.ico',
    },
  },
} as const satisfies ServerStorageData;
