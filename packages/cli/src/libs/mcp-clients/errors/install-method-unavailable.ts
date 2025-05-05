import type { InstallMethodLocation, Server } from '../types.ts';

export default class InstallLocationUnavailable extends Error {
  constructor(server: Server, location: InstallMethodLocation) {
    super(`Install location "${location}" is not available for server "${server.name}"`);
  }
}
