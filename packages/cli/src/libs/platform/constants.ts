import * as os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import platform from './get-platform.ts';

export const HOMEDIR = os.homedir();

let configdir: string;

switch (platform()) {
  case 'win32':
    // Use %APPDATA% on Windows
    configdir = process.env['APPDATA'] || path.join(HOMEDIR, 'AppData', 'Roaming');
    break;
  case 'darwin':
    // Use ~/Library/Application Support on macOS
    configdir = path.join(HOMEDIR, 'Library', 'Application Support');
    break;
  case 'linux':
  case 'unix':
    // Default to ~/.config on Linux/Unix
    configdir = process.env['XDG_CONFIG_HOME'] || path.join(HOMEDIR, '.config');
}

export { configdir as CONFIGDIR };
