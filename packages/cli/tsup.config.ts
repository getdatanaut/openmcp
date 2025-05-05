import assert from 'node:assert/strict';

import type { Plugin } from 'esbuild';
import { resolveModulePath } from 'exsolve';
import { defineConfig } from 'tsup';

import packageJson from './package.json' with { type: 'json' };

const entry = [
  ...Object.values(packageJson.imports).map(resolveEntry),
  ...Object.values(packageJson.exports).map(resolveEntry),
];

const importsResolverPlugin: Plugin = {
  name: 'imports-resolver',
  setup(build) {
    build.onResolve({ filter: /^#.+/ }, async args => {
      try {
        const resolvedPath = resolveModulePath(args.path, {
          from: new URL(args.importer, 'file://'),
          conditions: ['development'],
        });
        return {
          path: resolvedPath,
          external: false,
        };
      } catch (err) {
        return {
          path: args.path,
          errors: [
            {
              text: String(err),
            },
          ],
        };
      }
    });
  },
};

export default defineConfig({
  format: 'esm',
  sourcemap: true,
  clean: true,
  entry,
  external: ['@openmcp/schemas/mcp'],
  esbuildPlugins: [importsResolverPlugin],
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
