import type { Manager } from '../manager.ts';
import { createThread, Thread, type ThreadId, type ThreadOptions } from './thread.ts';

export interface ThreadManagerOptions {}

export function createThreadManager(options: ThreadManagerOptions, manager: Manager) {
  return new ThreadManager(options, manager);
}

/**
 * Manage multiple threads of messages.
 */
export class ThreadManager {
  #manager: Manager;

  constructor(options: ThreadManagerOptions, manager: Manager) {
    this.#manager = manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.#manager.storage.threads;
  }

  public list = async () => {
    return this.storage.select();
  };

  public get = async ({ id }: { id: ThreadId }) => {
    const thread = await this.storage.getById({ id });
    return thread ? Thread.deserialize(thread, this.#manager) : undefined;
  };

  public create = async (options: ThreadOptions) => {
    const thread = createThread(options, this.#manager);
    await this.storage.insert(Thread.serialize(thread));

    return thread;
  };

  public delete = async ({ id }: { id: ThreadId }) => {
    await this.storage.delete({ id });
  };

  public listMessages = async ({ id }: { id: ThreadId }) => {
    return this.#manager.storage.threadMessages.select({ threadId: id });
  };
}
