import { useLayoutEffect, useState } from 'react';

import type { Observable } from '../types.ts';

/**
 * A React hook that subscribes to an observable and returns its current value
 */
export function useObservable<T>(observable: Observable<T>): T {
  const [value, setValue] = useState<T>(observable.get());

  useLayoutEffect(() => {
    return observable.subscribe(newValue => {
      setValue(newValue);
    });
  }, [observable]);

  return value;
}
