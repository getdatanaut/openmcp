#!/usr/bin/env node --conditions=development --disable-warning=DEP0180
import assert from 'node:assert/strict';
import { register } from 'node:module';
import * as path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

try {
  process.loadEnvFile(path.join(import.meta.dirname, '../.env'));
} catch (error) {
  if (error?.['code'] !== 'ENOENT') {
    throw error;
  }

  console.warn('No .env file found, skipping loading environment variables');
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  strict: true,
  allowPositionals: true,
  options: {
    output: {
      type: 'string',
      short: 'o',
    },
    model: {
      type: 'string',
      default: 'gpt-4.1-mini',
    },
  },
});

assert.ok(positionals.length > 0, 'Usage: enhance-openapi [..path-or-glob-pattern-to-openapi-spec]');

// eslint-disable-next-line turbo/no-undeclared-env-vars
process.env.TS_NODE_PROJECT = path.join(import.meta.dirname, '../tsconfig.json');
register('ts-node/esm', import.meta.url);

try {
  await (
    await import('./index.ts')
  ).default({
    modelId: values.model,
    cwd: process.cwd(),
    outputDir: values.output ? path.resolve(process.cwd(), values.output) : null,
    patterns: positionals,
  });
} catch (error) {
  console.error(error);
  const { default: formatErrorMessage } = await import('./utils/format-error-message.ts');
  console.error(formatErrorMessage(error));
  process.exitCode ||= 1;
} finally {
  // process.exit();
}
