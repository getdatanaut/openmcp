import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // Required for any docker container to make
    // requests to the web service during development
    allowedHosts: ['host.docker.internal'],
  },
  plugins: [
    tailwindcss(),
    TanStackRouterVite({
      target: 'react',
      routeToken: 'layout',
    }),
    react(),
    cloudflare(),
    tsConfigPaths(),
    process.argv.includes('--analyze') ? analyzer() : null,
  ],

  define: {
    // https://bugs.rocicorp.dev/issue/3763
    'process.argv': [],
  },

  build: {
    rollupOptions: {
      external: ['@openmcp/schemas/mcp', '@openmcp/host-utils/mcp'],
    },
  },
});
