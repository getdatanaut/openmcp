import * as fs from 'node:fs';
import * as path from 'node:path';

import { type ConsolaOptions, createConsola } from 'consola';

import env from '../../env.ts';

const opts: Partial<ConsolaOptions & { fancy: boolean }> = {
  fancy: true,
};

const consola = createConsola(opts);

export default consola;

export async function createSilentConsole() {
  consola.restoreStd();
  let logFileWStream;
  try {
    const logFile = path.join(env.DN_CONFIGDIR, 'openmcp-cli-server.log');
    await fs.promises.mkdir(path.dirname(logFile), { recursive: true });
    logFileWStream = fs.createWriteStream(logFile, {
      flags: 'a',
      encoding: 'utf8',
      autoClose: true,
    });
  } catch {
    // this may happen for a number of reasons, such as
    // - no permissions to create the directory
    // - when process is executed within env with a read-only filesystem, i.e. inside of a k8s pod
    // In such event, we won't log anything
    const instance = createConsola({
      reporters: [
        {
          log() {
            // no-op reporter
          },
        },
      ],
    });
    instance.wrapConsole();
    return instance;
  }

  const instance = createConsola({
    stdout: logFileWStream,
    stderr: logFileWStream,
    reporters: [(await import('./reporters/log-file.ts')).default],
  });

  instance.wrapConsole();

  const restoreConsole = instance.restoreConsole;
  instance.restoreConsole = () => {
    restoreConsole.call(instance);
    logFileWStream?.end();
  };

  return instance;
}
