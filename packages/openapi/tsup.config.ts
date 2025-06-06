import { defineConfig } from 'tsup';

export default defineConfig({
  format: 'esm',
  sourcemap: true,
  clean: true,
  entry: ['src/index.ts', 'src/client.ts'],
});
