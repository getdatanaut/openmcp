import { injectEffect, injectSignal } from '@zedux/react';

const PREFIX = 'dn';

export const injectLocalStorage = <T extends Record<string, unknown>>({
  key,
  persistKeys = [],
  defaultVal,
}: {
  key: string;
  persistKeys?: (keyof T)[];
  defaultVal: T;
}) => {
  const fullKey = `${PREFIX}:${key}`;
  const val = typeof localStorage !== 'undefined' ? localStorage.getItem(fullKey) : null;

  // we're using the function overload of `injectSignal` to prevent JSON.parse
  // from running unnecesarily on reevaluations:
  const signal = injectSignal<T>(() => Object.assign({}, defaultVal, val ? JSON.parse(val) : {}));

  injectEffect(() =>
    signal.on('change', event => {
      if (typeof localStorage !== 'undefined') {
        let stateToPersist: Partial<T> | T;

        if (persistKeys?.length) {
          stateToPersist = {};

          for (const persistKey of persistKeys) {
            // Check if the key exists in the new state before assigning
            if (Object.prototype.hasOwnProperty.call(event.newState, persistKey)) {
              stateToPersist[persistKey] = event.newState[persistKey];
            }
          }
        } else {
          stateToPersist = event.newState;
        }

        localStorage.setItem(fullKey, JSON.stringify(stateToPersist));
      }
    }),
  );

  return signal;
};
