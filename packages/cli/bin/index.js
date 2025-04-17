#!/usr/bin/env node --no-warnings --experimental-strip-types
import process from 'node:process';

import register from '#register';

await register(process.argv.slice(2));
