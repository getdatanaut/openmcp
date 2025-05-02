export default class PrintableError extends Error {
  override readonly message: string;

  constructor(message: string, error: unknown) {
    super(message, { cause: error });
    this.message = `${message}: ${error instanceof Error ? error.message : String(error)}`;
  }

  override toString() {
    return this.message;
  }
}
