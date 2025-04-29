import { normalize } from 'node:path';
import { join } from 'node:path/posix';

import type { Constants } from '../types.ts';

export type ResolvableConfigPath = `${'$HOME' | '$CONFIG' | '$VSCODE' | ''}/${string}`;

export default function resolveConfigPath({ HOMEDIR, CONFIGDIR }: Constants, value: ResolvableConfigPath) {
  return normalize(
    value.replace(/^\$[A-Za-z_]+/g, v => {
      switch (v) {
        case '$HOME':
          return HOMEDIR;
        case '$CONFIG':
          return CONFIGDIR;
        case '$VSCODE':
          return join(CONFIGDIR, 'Code', 'User');
        default:
          throw new Error(`Unknown path variable: ${v}`);
      }
    }),
  );
}
