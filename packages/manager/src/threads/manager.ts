import type { Manager } from '../manager.ts';
import { createThread, Thread, type ThreadId, type ThreadMessage, type ThreadOptions } from './thread.ts';

export interface ThreadManagerOptions {}

export interface ThreadStorageData {
  threads: Pick<Thread, 'id' | 'clientId'>;
  threadMessages: ThreadMessage;
}

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

  public async list() {
    return this.storage.select();
  }

  public async get(id: ThreadId) {
    const thread = await this.storage.getById(id);
    return thread ? Thread.deserialize(thread, this.#manager) : undefined;
  }

  public async create(options: ThreadOptions) {
    const thread = createThread(options, this.#manager);
    await this.storage.insert(Thread.serialize(thread));

    return thread;
  }

  public async delete(id: ThreadId) {
    await this.storage.delete(id);
  }
}
