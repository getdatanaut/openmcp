import fs from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

import console from './index.ts';

export default async function wrapConsole() {
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
    console.consola.reporters = [(await import('./reporters/log-file.ts')).default];
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

  return () => {
    logFileWStream?.end();
    console.consola.restoreConsole();
  };
}
