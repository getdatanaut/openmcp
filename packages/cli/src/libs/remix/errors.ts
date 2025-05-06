export class ServerRegistrationError extends Error {
  override readonly name = 'ServerRegistrationError';

  constructor(name: string, reason: unknown) {
    super(`Failed to register server: ${name}`, {
      cause: reason,
    });
  }
}

export class ClientServerRegistrationError extends Error {
  override readonly name = 'ClientServerRegistrationError';

  constructor(name: string, reason: unknown) {
    super(`Failed to register client server: ${name}`, {
      cause: reason,
    });
  }
}
