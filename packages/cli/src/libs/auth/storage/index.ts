import type { Storage } from '@libs/auth/cli';

import { readFile, writeFile } from '../../config-dir.ts';
import Mutex from './mutex.ts';

export default class StorageImpl implements Storage {
  readonly #filename: string;
  readonly #data: Record<string, string>;
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

  /**
   * Stores a value securely
   * @param key The key to store the value under
   * @param value The value to store
   */
  async setItem(key: string, value: unknown): Promise<void> {
    await this.#mutex.lock(async () => {
      this.#data[key as string] = value as string;
      await this.#flush();
    });
  }

  /**
   * Retrieves a value from secure storage
   * @param key The key to retrieve
   * @returns The stored value, or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    return this.#data[key] ?? null;
  }

  /**
   * Removes a value from secure storage
   * @param key The key to remove
   */
  async removeItem(key: string): Promise<void> {
    await this.#mutex.lock(async () => {
      delete this.#data[key as string];
      await this.#flush();
    });
  }
}
