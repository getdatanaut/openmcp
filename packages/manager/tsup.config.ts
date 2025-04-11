import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    sourcemap: true,
    clean: true,
    platform: 'node',
    env: {
      PLATFORM: 'node',
    },
    outDir: 'dist/node',
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    sourcemap: true,
    clean: true,
    platform: 'browser',
    env: {
      PLATFORM: 'browser',
    },
    outDir: 'dist/browser',
  },
]);
