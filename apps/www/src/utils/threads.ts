import type { ClientId, McpManager, Storage } from '@openmcp/manager';
import {
  appendResponseMessages,
  type CoreAssistantMessage,
  type CoreToolMessage,
  type Message,
  type UIMessage,
} from 'ai';

export type ThreadId = string;

export type ThreadMessageId = string;

/**
 * Manager
 */

export interface ThreadManagerOptions {
  manager: {
    storage: {
      threads: Storage<ThreadStorageData>;
      threadMessages: Storage<ThreadMessageStorageData>;
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
  usage?: ThreadTokenUsage;
}
export interface ThreadStorageData {
  id: ThreadId;
  clientId: ClientId;
  name: string;
  createdAt: string;
  usage?: ThreadTokenUsage;
}

export interface ThreadTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ThreadOptions {
  manager: {
    storage: {
      threads: Storage<ThreadStorageData>;
      threadMessages: Storage<ThreadMessageStorageData>;
    };
  };
}

// ai doesn't export this type
export type AIResponseMessage = (CoreAssistantMessage | CoreToolMessage) & {
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
  public readonly usage: ThreadTokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

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
      usage: thread.usage,
    } satisfies ThreadStorageData;
  }

  constructor(data: ThreadStorageData, options: ThreadOptions) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.name = data.name;
    this.createdAt = data.createdAt;

    if (data.usage) {
      this.usage = data.usage;
    }

    this.#manager = options.manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.#manager.storage;
  }

  #updateUsage = async (usage: ThreadTokenUsage) => {
    this.usage.promptTokens += usage.promptTokens;
    this.usage.completionTokens += usage.completionTokens;
    this.usage.totalTokens += usage.totalTokens;

    await this.storage.threads.update(
      { id: this.id },
      {
        usage: this.usage,
      },
    );
  };

  public listMessages = async () => {
    return this.storage.threadMessages.findMany({ threadId: this.id });
  };

  public addMessage = async (message: UIMessage | Message, options?: { usage?: ThreadTokenUsage }) => {
    if (options?.usage) {
      await this.#updateUsage(options.usage);
    }

    // Do not need all properties - for example the deprecated toolInvocations array
    const newMessage = {
      id: message.id,
      role: message.role,
      // Do not need to duplicate content - prefer parts if present
      content: message.parts?.length ? '' : message.content,
      parts: message.parts || [],
      createdAt: message.createdAt,
      annotations: message.annotations,
      experimental_attachments: message.experimental_attachments,
    } satisfies UIMessage;

    await this.storage.threadMessages.upsert(
      { id: newMessage.id },
      {
        ...newMessage,
        threadId: this.id,
      },
    );
  };

  public addResponseMessages = async ({
    originalMessages,
    responseMessages,
    usage,
  }: {
    originalMessages: UIMessage[];
    responseMessages: AIResponseMessage[];
    usage?: ThreadTokenUsage;
  }) => {
    if (usage) {
      await this.#updateUsage(usage);
    }

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

    await Promise.all(
      messages.map(async (message, msgIndex) => {
        const isLast = msgIndex === messages.length - 1;
        await this.storage.threadMessages.upsert({ id: message.id }, isLast ? { ...message, usage } : message);
      }),
    );
  };
}
