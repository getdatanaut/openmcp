import type * as fs from 'node:fs/promises';

import type { z } from 'zod';

import type { ResolvableConfigPath } from './config/index.ts';

export type Constants = {
  readonly HOMEDIR: string;
  readonly CONFIGDIR: string;
};

export type Context = {
  readonly platform: 'darwin' | 'linux' | 'unix' | 'win32';
  readonly constants: Constants & { readonly CWD: string };
  readonly logger: Logger;
  readonly fs: {
    readonly readFile: typeof fs.readFile;
    readonly writeFile: typeof fs.writeFile;
    readonly mkdir: typeof fs.mkdir;
  };
};

export type Logger = {
  start(message: string): void;
  success(message: string): void;
  verbose(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(error: Error & { cause?: unknown }): void;
};

export type FsInstallMethod<O = unknown> = {
  readonly type: 'fs';
  readonly filepath: ResolvableConfigPath;
  readonly schema: z.Schema<O>;
  readonly location: InstallMethodLocation;
};

export type InstallMethodLocation = 'local' | 'global';

export type InstallMethod = FsInstallMethod;

export type Remix = {
  readonly id: string;
  readonly name: string;
  readonly target: string;
};

export type InstallLocation = 'local' | 'global' | 'prefer-local';

export type Server = Remix;

export type McpHostClient<M extends InstallMethod[]> = {
  readonly name: string;
  readonly installMethods: M;
  install(ctx: Context, server: Server, location: InstallLocation): Promise<InstallMethod>;
  uninstall(ctx: Context, server: Server, location: InstallLocation): Promise<InstallMethod>;
};
