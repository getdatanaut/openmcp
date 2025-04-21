import type { OAuth2Tokens, Storage } from '@libs/auth/cli';

import { readFile, writeFile } from '../../config-dir.ts';
import Mutex from './mutex.ts';

export default class StorageImpl implements Storage {
  readonly #filename: string;
  readonly #data: OAuth2Tokens;
  readonly #mutex = new Mutex();

  constructor(filename: string, data: Record<string, string>) {
    this.#filename = filename;
    this.#data = data;
  }

  /**
   * Creates a new storage instance
   *
   * @param namespace
   */
  static async create(namespace: string) {
    const filename = `storage-${namespace}.json`;
    const data = await readFile(filename);
    try {
      return new StorageImpl(filename, data === null ? {} : JSON.parse(data));
    } catch {
      return new StorageImpl(filename, {});
    }
  }

  async #flush() {
    await writeFile(this.#filename, JSON.stringify(this.#data));
  }

  async setItem(key: string, value: unknown): Promise<void> {
    await this.#mutex.lock(async () => {
      this.#data[key as string] = value as string;
      await this.#flush();
    });
  }

  async getItem<K extends keyof OAuth2Tokens>(key: K): Promise<OAuth2Tokens[K] | null> {
    return this.#data[key] ?? null;
  }

  async removeItem(key: string): Promise<void> {
    await this.#mutex.lock(async () => {
      delete this.#data[key as string];
      await this.#flush();
    });
  }

  async clear() {
    await this.#mutex.lock(async () => {
      for (const key of Object.keys(this.#data)) {
        delete this.#data[key];
      }
      await this.#flush();
    });
  }
}
