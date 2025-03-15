import { appendResponseMessages, type CoreAssistantMessage, type CoreToolMessage, type UIMessage } from 'ai';

import type { ClientId } from '../client.ts';
import type { Manager } from '../manager.ts';

export type ThreadId = string;
export type ThreadMessageId = string;

export interface ThreadMessageStorageData extends UIMessage {
  id: ThreadMessageId;
  threadId: ThreadId;
}

export interface ThreadOptions {
  id: ThreadId;
  clientId: ClientId;
  name: string;
}

export interface ThreadStorageData {
  id: ThreadId;
  // @QUESTION clientId basically userId?
  clientId: ClientId;
  name: string;
}

type ResponseMessage = (CoreAssistantMessage | CoreToolMessage) & {
  id: string;
};

export function createThread(options: ThreadOptions, manager: Manager) {
  return new Thread(options, manager);
}

/**
 * A single thread of messages.
 */
export class Thread {
  public readonly id: ThreadId;
  public readonly clientId: ClientId;
  public readonly name: string;

  #manager: Manager;

  static deserialize(data: ThreadStorageData, manager: Manager): Thread {
    return new Thread(data, manager);
  }

  static serialize(thread: Thread): ThreadStorageData {
    return {
      id: thread.id,
      clientId: thread.clientId,
      name: thread.name,
    };
  }

  constructor(options: ThreadOptions, manager: Manager) {
    this.id = options.id;
    this.clientId = options.clientId;
    this.name = options.name;
    this.#manager = manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.#manager.storage;
  }

  public listMessages = async () => {
    return this.storage.threadMessages.select({ threadId: this.id });
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
