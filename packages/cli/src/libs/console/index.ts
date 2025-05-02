import * as fs from 'node:fs';
import * as path from 'node:path';

import { createConsola } from 'consola';

import env from '../../env.ts';
import fancyReporter from './reporters/fancy.ts';
import type { PromptlessConsola } from './types.ts';

const opts = {
  reporters: [fancyReporter],
};

const consola: PromptlessConsola = createConsola(opts);
export * as prompt from './prompts/index.ts';

export default consola;

export async function pipeToLogFile() {
  consola.restoreStd();
  const { createStream } = await import('rotating-file-stream');

  let logFileWStream;
  try {
    const logFile = path.join(env.DN_CONFIGDIR, 'openmcp-cli-server.log');
    await fs.promises.mkdir(path.dirname(logFile), { recursive: true });
    logFileWStream = createStream(logFile, {
      size: '5M',
      interval: '7d',
      initialRotation: true,
      intervalBoundary: true,
      compress: 'gzip',
    });
  } catch {
    // this may happen for a number of reasons, such as
    // - no permissions to create the directory
    // - when process is executed within env with a read-only filesystem, i.e. inside of a k8s pod
    // In such event, we won't log anything
    consola.setReporters([]);
    return;
  }

  const { stdout, stderr } = consola.options;

  consola.options.stdout = logFileWStream;
  consola.options.stderr = logFileWStream;
  consola.setReporters([(await import('./reporters/log-file.ts')).default]);

  return {
    [Symbol.dispose]() {
      consola.options.stdout = stdout;
      consola.options.stderr = stderr;
      logFileWStream.end();
    },
  };
}
