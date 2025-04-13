#!/usr/bin/env node
import * as fs from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';
import process from 'node:process';

import console from '@libs/console';

let logFileWStream;
try {
  const logFile = path.join(homedir(), '.datanaut', 'openmcp-cli-server.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  logFileWStream = fs.createWriteStream(logFile, {
    flags: 'a',
    encoding: 'utf8',
    autoClose: true,
  });

  console.consola.stderr = logFileWStream;
  console.consola.stdout = console.consola.stderr;
  console.consola.reporters = [(await import('@libs/console/reporters/log-file')).default];
} catch {
  // this may happen for a number of reasons, such as
  // - no permissions to create the directory
  // - when process is executed within env with a read-only filesystem, i.e. inside of a k8s pod
  // In such event, we won't log anything
  console.consola.reporters = [
    {
      log() {
        // no-op reporter
      },
    },
  ];
}

console.consola.wrapConsole();

const { default: register } = await import('#register');
await register(process.argv.slice(2));
