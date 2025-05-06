import type { Server } from '../types.ts';

export default class ServerConflict extends Error {
  constructor(server: Server) {
    super(`Server "${server.name}" is already installed.`);
  }
}
