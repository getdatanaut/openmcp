#!/usr/bin/env node --conditions=development --disable-warning=DEP0180
import { register } from 'node:module';
import * as path from 'node:path';
import process from 'node:process';

// eslint-disable-next-line turbo/no-undeclared-env-vars
process.env.TS_NODE_PROJECT = path.join(import.meta.dirname, '../tsconfig.json');
register('ts-node/esm', import.meta.url);

await import('./index.ts');
