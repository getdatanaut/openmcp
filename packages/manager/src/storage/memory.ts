import { type StorageItem, type StorageTable } from './index.ts';

export function createMemoryStorage<Shape extends StorageItem>(
  initialData?: Shape[],
  options?: {
    primaryKey?: keyof StorageItem;
  },
) {
  return MemoryStorage.create(initialData, options);
}

export class MemoryStorage<T extends StorageItem> implements StorageTable<T> {
  private rows: T[] = [];
  private index: Map<string, T> = new Map();
  private primaryKey: keyof T;

  private constructor(primaryKey: keyof T) {
    this.primaryKey = primaryKey;
  }

  static create<T extends StorageItem>(initialData?: T[], options?: { primaryKey?: keyof T }): MemoryStorage<T> {
    const table = new MemoryStorage<T>(options?.primaryKey ?? 'id');
    if (initialData) {
      for (const row of initialData) {
        table.insert(row).catch(() => {
          // Noop
        });
      }
    }
    return table;
  }

  async insert(row: T): Promise<void> {
    const pkValue = String(row[this.primaryKey]);
    if (this.index.has(pkValue)) {
      throw new Error(`Duplicate primary key: ${pkValue}`);
    }
    this.rows.push(row);
    this.index.set(pkValue, row);
  }

  async upsert({ id }: { id: string | number }, newData: T): Promise<void> {
    const row = this.index.get(String(id));
    if (row) {
      Object.assign(row, newData);
    } else {
      await this.insert({ ...newData, [this.primaryKey]: id });
    }
  }

  async update({ id }: { id: string | number }, newData: Partial<T>): Promise<void> {
    const row = this.index.get(String(id));
    if (!row) {
      throw new Error(`Row with ${String(this.primaryKey)} ${id} not found`);
    }
    Object.assign(row, newData);
  }

  async delete({ id }: { id: string | number }): Promise<void> {
    const pkValue = String(id);
    const index = this.rows.findIndex(row => String(row[this.primaryKey]) === pkValue);
    if (index === -1) {
      throw new Error(`Row with ${String(this.primaryKey)} ${id} not found`);
    }
    this.rows.splice(index, 1);
    this.index.delete(pkValue);
  }

  async select(where?: Partial<T>): Promise<T[]> {
    return where
      ? this.rows.filter(row => Object.entries(where).every(([key, value]) => row[key] === value))
      : this.rows;
  }

  async getById({ id }: { id: string | number }): Promise<T | undefined> {
    return this.index.get(String(id));
  }
}
