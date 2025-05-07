import type { Subscriber } from './types.ts';

export function createShallowObservableArray<T>(initialValues: T[]) {
  const array: T[] = [...initialValues];
  const subscribers = new Set<Subscriber<T[]>>();

  return {
    get() {
      return array.slice();
    },
    get length() {
      return array.length;
    },
    push(...items: T[]) {
      array.push(...items);
      for (const subscriber of subscribers) {
        subscriber(array.slice());
      }

      return array.length;
    },
    subscribe(subscriber: Subscriber<T[]>) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    [Symbol.dispose]() {
      subscribers.clear();
    },
  };
}
