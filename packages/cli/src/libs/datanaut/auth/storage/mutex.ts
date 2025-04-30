/**
 * A simple mutex implementation for asynchronous functions
 * Note: this is not a general purpose mutex implementation, it is only
 * intended to be used for synchronizing access to a single resource.
 */
export default class Mutex {
  private mutex = Promise.resolve();

  /**
   * Locks the mutex and executes the given function
   * @param fn The function to execute while the mutex is locked
   * @returns The result of the function
   */
  async lock<T>(fn: () => Promise<T>): Promise<T> {
    const { promise: newMutex, resolve: unlock } = Promise.withResolvers<void>();

    // Wait for the previous operation to complete
    const previousMutex = this.mutex;
    this.mutex = previousMutex.then(() => newMutex);

    try {
      await previousMutex;
      return await fn();
    } finally {
      unlock();
    }
  }
}
