export type StorageItem = Record<string, any>;

export type Storage<T extends StorageItem> = StorageTable<T>;

export interface StorageTable<T extends StorageItem> {
  /** Inserts a new row into the table */
  insert(row: T): Promise<void>;

  /** Creates or updates a row by its primary key */
  upsert({ id }: { id: string }, row: T): Promise<void>;

  /** Updates an existing row by its primary key */
  update({ id }: { id: string }, row: Partial<T>): Promise<void>;

  /** Deletes a row by its primary key */
  delete({ id }: { id: string }): Promise<void>;

  /** Retrieves rows matching a predicate */
  select(where?: Partial<T>): Promise<T[]>;

  /** Retrieves a row by its primary key */
  getById({ id }: { id: string }): Promise<T | undefined>;
}
