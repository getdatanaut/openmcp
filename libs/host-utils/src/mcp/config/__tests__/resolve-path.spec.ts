import { normalize } from 'node:path';
import { join } from 'node:path/posix';

import { describe, expect, it } from 'vitest';

import type { ResolvableConfigPath } from '../resolve-path.ts';
import resolveConfigPath from '../resolve-path.ts';

describe('resolveConfigPath', () => {
  const constants = {
    HOMEDIR: '/home/user',
    CONFIGDIR: '/home/user/.config',
  } as const;

  it('should replace $HOME with homedir', () => {
    const path: ResolvableConfigPath = '$HOME/some/path';
    const result = resolveConfigPath(constants, path);
    expect(result).toBe(normalize('/home/user/some/path'));
  });

  it('should replace $CONFIG with configdir', () => {
    const path: ResolvableConfigPath = '$CONFIG/some/path';
    const result = resolveConfigPath(constants, path);
    expect(result).toBe(normalize('/home/user/.config/some/path'));
  });

  it('should replace $VSCODE with join(configdir, "Code", "User")', () => {
    const path: ResolvableConfigPath = '$VSCODE/some/path';
    const result = resolveConfigPath(constants, path);
    expect(result).toBe(normalize(join('/home/user/.config', 'Code', 'User', 'some/path')));
  });

  it('should throw an error for unknown path variables', () => {
    const path = '$UNKNOWN/some/path' as ResolvableConfigPath;
    expect(() => resolveConfigPath(constants, path)).toThrow('Unknown path variable: $UNKNOWN');
  });

  it('should handle paths without variables', () => {
    const path: ResolvableConfigPath = '/absolute/path';
    const result = resolveConfigPath(constants, path);
    expect(result).toBe(normalize('/absolute/path'));
  });

  it('should handle empty paths', () => {
    const path: ResolvableConfigPath = '/';
    const result = resolveConfigPath(constants, path);
    expect(result).toBe(normalize('/'));
  });

  it('should handle paths with multiple segments', () => {
    const path: ResolvableConfigPath = '$HOME/path/to/file.txt';
    const result = resolveConfigPath(constants, path);
    expect(result).toBe(normalize('/home/user/path/to/file.txt'));
  });
});
