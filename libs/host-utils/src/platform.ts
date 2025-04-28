import { platform } from 'node:os';

export default () => {
  const p = platform();
  if (p === 'win32') return 'win32';
  else if (p === 'darwin') return 'darwin';
  else if (p === 'linux') return 'linux';
  else return 'unix';
};
