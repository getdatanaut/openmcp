export type InstalledServer = {
  readonly name: string;
  readonly command: 'npx' | 'node';
  readonly args: readonly string[];
};
