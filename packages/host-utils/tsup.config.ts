import { defineConfig } from 'tsup';

export default defineConfig({
  format: 'esm',
  sourcemap: true,
  clean: true,
  entry: ['src/index.ts', 'src/mcp/index.ts', 'src/mcp/index.browser.ts'],
});
