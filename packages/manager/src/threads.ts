import { appendResponseMessages, type CoreAssistantMessage, type CoreToolMessage, type UIMessage } from 'ai';

import type { MpcManager } from './manager.ts';
import type { ClientId, ThreadId, ThreadMessageId } from './types.ts';

/**
 * Manager
 */

export interface ThreadManagerOptions {
  manager: {
    storage: {
      threads: MpcManager['storage']['threads'];
      threadMessages: MpcManager['storage']['threadMessages'];
    };
  };
}

export function createThreadManager(options: ThreadManagerOptions) {
  return new ThreadManager(options);
}

export class ThreadManager {
  #manager: ThreadManagerOptions['manager'];

  constructor(options: ThreadManagerOptions) {
    this.#manager = options.manager;
  }

  protected get storage() {
    return this.#manager.storage.threads;
  }

  public findMany = async (where?: Partial<ThreadStorageData>) => {
    return this.storage.findMany(where);
  };

  public get = async ({ id }: { id: ThreadId }) => {
    const thread = await this.storage.getById({ id });
    return thread ? Thread.deserialize(thread, { manager: this.#manager }) : undefined;
  };

  public create = async (data: ThreadStorageData) => {
    const thread = createThread(data, { manager: this.#manager });
    await this.storage.insert(Thread.serialize(thread));

    return thread;
  };

  public delete = async ({ id }: { id: ThreadId }) => {
    await this.storage.delete({ id });
  };

  public update = async ({ id }: { id: ThreadId }, data: Partial<ThreadStorageData>) => {
    await this.storage.update({ id }, data);

    return this.storage.getById({ id });
  };

  public listMessages = async ({ id }: { id: ThreadId }) => {
    return this.#manager.storage.threadMessages.findMany({ threadId: id });
  };
}

/*
 * Instance
 */

export interface ThreadMessageStorageData extends UIMessage {
  id: ThreadMessageId;
  threadId: ThreadId;
}
export interface ThreadStorageData {
  id: ThreadId;
  clientId: ClientId;
  name: string;
  createdAt: string;
}

export interface ThreadOptions {
  manager: {
    storage: {
      threads: MpcManager['storage']['threads'];
      threadMessages: MpcManager['storage']['threadMessages'];
    };
  };
}

type ResponseMessage = (CoreAssistantMessage | CoreToolMessage) & {
  id: string;
};

export function createThread(data: ThreadStorageData, options: ThreadOptions) {
  return new Thread(data, options);
}

/**
 * A single thread of messages.
 */
export class Thread {
  public readonly id: ThreadId;
  public readonly clientId: ClientId;
  public readonly name: string;
  public readonly createdAt: string;

  #manager: ThreadOptions['manager'];

  static deserialize(data: ThreadStorageData, options: ThreadOptions): Thread {
    return new Thread(data, options);
  }

  static serialize(thread: Thread) {
    return {
      id: thread.id,
      clientId: thread.clientId,
      name: thread.name,
      createdAt: thread.createdAt,
    } satisfies ThreadStorageData;
  }

  constructor(data: ThreadStorageData, options: ThreadOptions) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.#manager = options.manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.#manager.storage;
  }

  public listMessages = async () => {
    return this.storage.threadMessages.findMany({ threadId: this.id });
  };

  public addMessage = async (message: UIMessage) => {
    await this.storage.threadMessages.insert({
      ...message,
      threadId: this.id,
    });
  };

  public addResponseMessages = async ({
    originalMessages,
    responseMessages,
  }: {
    originalMessages: UIMessage[];
    responseMessages: ResponseMessage[];
  }) => {
    const messages = appendResponseMessages({ messages: originalMessages, responseMessages }).map(message => ({
      ...message,
      parts: message.parts ?? [],
      threadId: this.id,
    }));

    const messageObject = messages.reduce(
      (acc, message) => {
        acc[message.id] = message;
        return acc;
      },
      {} as Record<ThreadMessageId, ThreadMessageStorageData>,
    );

    for (const originalMessage of originalMessages) {
      if (!messageObject[originalMessage.id]) {
        await this.storage.threadMessages.delete({ id: originalMessage.id });
      }
    }

    for (const message of messages) {
      await this.storage.threadMessages.upsert({ id: message.id }, message);
    }
  };
}
