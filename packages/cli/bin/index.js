#!/usr/bin/env node --no-warnings
import process from 'node:process';

import register from '#register';

await register(process.argv.slice(2));
