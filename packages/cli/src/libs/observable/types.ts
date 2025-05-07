export type Subscriber<T> = (value: T) => void;

export type Observable<T> = {
  get(): T;
  subscribe(subscriber: Subscriber<T>): () => void;
};
