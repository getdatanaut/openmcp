#!/usr/bin/env node
import process from 'node:process';

await import('#console');

const { default: register } = await import('#register');
await register(process.argv.slice(2));
