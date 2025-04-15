import * as fs from 'node:fs';
import * as path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
      routeToken: 'layout',
    }),
    react({
      babel: {
        plugins: [['@babel/plugin-proposal-decorators', { version: '2023-05' }]],
      },
    }),
    tsConfigPaths(),
  ],

  ...(process.env['NODE_ENV'] === 'development' && {
    server: {
      https: {
        key: fs.readFileSync(path.join(import.meta.dirname, '.certs/localhost-key.pem')),
        cert: fs.readFileSync(path.join(import.meta.dirname, '.certs/localhost.pem')),
      },
    },
  }),

  define: {
    'process.env': {},
  },
});
