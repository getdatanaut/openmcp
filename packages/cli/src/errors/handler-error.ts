export default class HandlerError extends Error {
  override readonly message: string;

  constructor(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    super(message, { cause: error });
    this.message = message;
  }
}
