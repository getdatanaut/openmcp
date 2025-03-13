export type StorageItem = Record<string, any>;

export type Storage<T = Record<string, StorageItem>> = {
  [K in keyof T]: StorageTable<T[K]>;
};

export interface StorageTable<T = StorageItem> {
  /** Inserts a new row into the table */
  insert(row: T): Promise<void>;

  /** Creates or updates a row by its primary key */
  upsert(id: string | number, row: T): Promise<void>;

  /** Updates an existing row by its primary key */
  update(id: string | number, row: Partial<T>): Promise<void>;

  /** Deletes a row by its primary key */
  delete(id: string | number): Promise<void>;

  /** Retrieves rows matching a predicate */
  select(predicate?: (row: T) => boolean): Promise<T[]>;

  /** Retrieves a row by its primary key */
  getById(id: string | number): Promise<T | undefined>;
}
