import * as os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import platform from './platform.ts';

export const HOMEDIR = os.homedir();

let configdir: string;

switch (platform()) {
  case 'win32':
    // Use %APPDATA% on Windows
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    configdir = process.env['APPDATA'] || path.join(HOMEDIR, 'AppData', 'Roaming');
    break;
  case 'darwin':
    // Use ~/Library/Application Support on macOS
    configdir = path.join(HOMEDIR, 'Library', 'Application Support');
    break;
  case 'linux':
  case 'unix':
    // Default to ~/.config on Linux/Unix
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    configdir = process.env['XDG_CONFIG_HOME'] || path.join(HOMEDIR, '.config');
}

export { configdir as CONFIGDIR };
