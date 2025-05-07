import type { Subscriber } from './types.ts';

/**
 * Creates an observable box that notifies subscribers when its value changes
 */
export function createObservableRef<T>(initialValue: T) {
  let currentValue = initialValue;
  const subscribers = new Set<Subscriber<T>>();

  return {
    get() {
      return currentValue;
    },
    set(newValue: T) {
      currentValue = newValue;
      for (const subscriber of subscribers) {
        subscriber(newValue);
      }
    },
    subscribe(subscriber: Subscriber<T>) {
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
