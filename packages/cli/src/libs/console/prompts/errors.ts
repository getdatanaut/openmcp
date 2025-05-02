export class OperationCancelled extends Error {
  constructor() {
    super('Operation cancelled');
  }
}
