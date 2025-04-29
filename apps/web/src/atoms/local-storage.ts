import { injectEffect, injectSignal } from '@zedux/react';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';

const PREFIX = 'dn';

export const injectLocalStorage = <T extends object>({
  key,
  persistKeys = [],
  defaultVal,
}: {
  key: string;
  persistKeys?: PropertyPath<T>[];
  defaultVal: T;
}) => {
  const fullKey = `${PREFIX}:${key}`;
  const val = typeof localStorage !== 'undefined' ? localStorage.getItem(fullKey) : null;

  // we're using the function overload of `injectSignal` to prevent JSON.parse
  // from running unnecesarily on reevaluations:
  const signal = injectSignal<T>(() => Object.assign({}, defaultVal, val ? JSON.parse(val) : {}));

  injectEffect(() =>
    signal.on('change', event => {
      if (typeof localStorage === 'undefined') return;

      let stateToPersist: Record<string, any> = {};

      if (persistKeys?.length) {
        // Use lodash get and set to handle nested paths
        for (const keyOrPath of persistKeys) {
          // Get value from the *new* state
          const value = _get(event.newState, keyOrPath);

          // Only persist if the value is defined
          if (value !== undefined) {
            // Set value into the object we will persist
            _set(stateToPersist, keyOrPath, value);
          }
        }
      } else {
        // If no persistKeys, persist the entire new state
        stateToPersist = event.newState;
      }

      localStorage.setItem(fullKey, JSON.stringify(stateToPersist));
    }),
  );

  return signal;
};

// --- START: Type definitions for type-safe paths ---
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

// Helper to get keys of non-function properties
type ExcludeFunctionProps<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

// Recursively builds dot-notation paths for object properties, excluding functions
type DeepKeys<T> = T extends Primitive
  ? never
  : {
      // Iterate over string keys of non-function properties
      [K in ExcludeFunctionProps<T> & string]: T[K] extends Primitive
        ? `${K}` // If the non-function property is primitive, return the key
        : // If the non-function property is an object, include key and recurse
          `${K}` | `${K}.${DeepKeys<T[K]>}`;
    }[ExcludeFunctionProps<T> & string]; // Extract the generated string paths

// Combines type-safe dot-notation object paths (excluding functions) with less safe array paths
export type PropertyPath<T> = DeepKeys<T> | (string | number)[];
// --- END: Type definitions ---
