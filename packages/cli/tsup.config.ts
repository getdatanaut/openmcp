import assert from 'node:assert/strict';

import { defineConfig } from 'tsup';

import packageJson from './package.json' with { type: 'json' };

const entry = [
  ...Object.values(packageJson.imports).map(resolveEntry),
  ...Object.values(packageJson.exports).map(resolveEntry),
];

export default defineConfig({
  format: 'esm',
  sourcemap: true,
  clean: true,
  entry,
  external: ['@openmcp/schemas/mcp', '@openmcp/host-utils/mcp', ...Object.keys(packageJson.imports)],
});

function resolveEntry(entry: Record<string, string>): string {
  const development = entry['development'];
  assert.ok(development, 'development entry is missing');
  assert.ok(development === entry['types'], 'Mismatch between development and types entry');
  assert.ok(
    entry['default'] === development.replace('./src/', './dist/').replace(/\.ts$/, '.js'),
    'Wrong default entry',
  );

  return development;
}
