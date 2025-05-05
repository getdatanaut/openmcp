import { normalize } from 'node:path';
import { join } from 'node:path/posix';

import type { Context } from '../types.ts';

export type ResolvableConfigPath = `${'$CWD' | '$HOME' | '$CONFIG' | '$VSCODE' | ''}/${string}`;

export default function resolveConfigPath(
  { HOMEDIR, CONFIGDIR, CWD }: Context['constants'],
  value: ResolvableConfigPath,
) {
  return normalize(
    value.replace(/^\$[A-Za-z_]+/g, v => {
      switch (v) {
        case '$HOME':
          return HOMEDIR;
        case '$CONFIG':
          return CONFIGDIR;
        case '$CWD':
          return CWD;
        case '$VSCODE':
          return join(CONFIGDIR, 'Code', 'User');
        default:
          throw new Error(`Unknown path variable: ${v}`);
      }
    }),
  );
}
