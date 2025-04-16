import { injectEffect, injectSignal } from '@zedux/react';

export const injectLocalStorage = <T>(key: string, defaultVal: T) => {
  const val = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;

  // we're using the function overload of `injectSignal` to prevent JSON.parse
  // from running unnecesarily on reevaluations:
  const signal = injectSignal<T>(() => (val ? JSON.parse(val) : defaultVal));

  injectEffect(() =>
    signal.on('change', event => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(event.newState));
      }
    }),
  );

  return signal;
};
