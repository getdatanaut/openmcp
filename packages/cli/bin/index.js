#!/usr/bin/env node
import process from 'node:process';

import register from '#register';

await register(process.argv.slice(2));
