import { defineConfig } from 'tsup';

export default defineConfig({
  format: 'esm',
  sourcemap: true,
  clean: true,
  entry: ['src/index.ts', 'src/api.ts', 'src/register.ts', 'src/rpc/index.ts', 'src/libs/openapi/index.ts'],
  external: ['@openmcp/schemas/mcp', '@openmcp/host-utils/mcp'],
});
