import {
  appendResponseMessages,
  type CoreAssistantMessage,
  type CoreToolMessage,
  type Message,
  type UIMessage,
} from 'ai';

import type { ClientId } from '../client.ts';
import type { Manager } from '../manager.ts';

export type ThreadId = string;
export type ThreadMessageId = string;

export type ThreadMessage = Message & {
  id: ThreadMessageId;
  threadId: ThreadId;
};

export interface ThreadOptions {
  id: ThreadId;
  clientId: ClientId;
}

export interface ThreadStorageData {
  id: ThreadId;
  clientId: ClientId;
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

  #manager: Manager;

  static deserialize(data: ThreadStorageData, manager: Manager): Thread {
    const thread = new Thread({ id: data.id, clientId: data.clientId }, manager);
    return thread;
  }

  static serialize(thread: Thread): ThreadStorageData {
    return {
      id: thread.id,
      clientId: thread.clientId,
    };
  }

  constructor(options: ThreadOptions, manager: Manager) {
    this.id = options.id;
    this.clientId = options.clientId;
    this.#manager = manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.#manager.storage;
  }

  public async listMessages() {
    return this.storage.threadMessages.select(message => message.threadId === this.id);
  }

  public async addMessage(message: UIMessage) {
    await this.storage.threadMessages.insert({
      ...message,
      threadId: this.id,
    });
  }

  public async addResponseMessages(responseMessages: ResponseMessage[]) {
    const originalMessages = await this.listMessages();

    const messages = appendResponseMessages({ messages: originalMessages, responseMessages }).map(message => ({
      ...message,
      threadId: this.id,
    }));

    const messageObject = messages.reduce(
      (acc, message) => {
        acc[message.id] = message;
        return acc;
      },
      {} as Record<ThreadMessageId, ThreadMessage>,
    );

    for (const originalMessage of originalMessages) {
      if (!messageObject[originalMessage.id]) {
        await this.storage.threadMessages.delete(originalMessage.id);
      }
    }

    for (const message of messages) {
      await this.storage.threadMessages.upsert(message.id, message);
    }
  }
}
