import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from '@tanstack/react-start/config';
import { cloudflare } from 'unenv';
import { analyzer } from 'vite-bundle-analyzer';
import tsConfigPaths from 'vite-tsconfig-paths';

// flip to true if you want to analyze the bundle.. doesn't work well w vinxi though
const ANALYZE = process.argv.includes('--analyze') || false;

export default defineConfig({
  server: {
    compatibilityDate: '2025-04-30',
    preset: 'cloudflare_module',
    unenv: cloudflare,
  },
  tsr: {
    routeToken: 'layout',
    appDirectory: 'src',
  },
  vite: {
    plugins: [tsConfigPaths(), tailwindcss(), ANALYZE ? analyzer() : null],
  },
});
