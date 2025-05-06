export class OperationCanceledError extends Error {
  constructor() {
    super('Operation was canceled');
  }
}

export class OperationTimedOutError extends Error {
  constructor(timeout: number) {
    super(`Operation timed out after ${timeout}ms`);
  }
}
