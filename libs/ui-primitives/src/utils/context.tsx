/* eslint-disable @typescript-eslint/no-explicit-any */
import { mergeProps } from '@ariakit/react-core/utils/misc';
import * as React from 'react';

export interface CreateContextOptions {
  /**
   * If `true`, React will throw if context is `null` or `undefined`
   * In some cases, you might want to support nested context, so you can set it to `false`
   */
  strict?: boolean;

  /**
   * Error message to throw if the context is `undefined`
   */
  errorMessage?: string;

  /**
   * The display name of the context
   */
  name?: string;
}

export type CreateContextReturn<T> = [React.Context<T>, () => T];

/**
 * Creates a named context, provider, and hook.
 *
 * @param options create context options
 */
export function createContext<ContextType>(
  options: CreateContextOptions & { strict: false },
): CreateContextReturn<ContextType | undefined>;
export function createContext<ContextType>(options?: CreateContextOptions): CreateContextReturn<ContextType>;
export function createContext<ContextType>(options: CreateContextOptions = {}) {
  const { strict = true, errorMessage, name } = options;

  const Context = React.createContext<ContextType | undefined>(undefined);

  Context.displayName = name;

  function useContext() {
    const context = React.useContext(Context);

    if (!context && strict) {
      const error = new Error(
        errorMessage || `use${name} is undefined. You probably forgot to wrap the component within a ${name} provider.`,
      );

      error.name = 'ContextError';
      Error.captureStackTrace?.(error, useContext);
      throw error;
    }

    return context;
  }

  return [Context, useContext];
}

/**
 * The slot and provider system below is adapted from react-aria-components. Credit to them!
 * https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/utils.tsx
 */

export const defaultSlot = Symbol('default');

interface SlottedValue<T> {
  slots?: Record<string | symbol, T>;
}

export interface SlotProps {
  /**
   * A slot name for the component. Slots allow the component to receive props from a parent component.
   * An explicit `null` value indicates that the local props completely override all props received from a parent.
   */
  slot?: string | null;
}

export type SlottedContextValue<T> = SlottedValue<T> | T | null | undefined;
export type WithRef<T, E> = T & { ref?: React.ForwardedRef<E> };
export type ContextValue<T, E extends Element> = SlottedContextValue<WithRef<T, E>>;

type ProviderValue<T> = [React.Context<T>, T];
type ProviderValues<A, B, C, D, E, F, G, H, I, J, K> =
  | [ProviderValue<A>]
  | [ProviderValue<A>, ProviderValue<B>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
      ProviderValue<I>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
      ProviderValue<I>,
      ProviderValue<J>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
      ProviderValue<I>,
      ProviderValue<J>,
      ProviderValue<K>,
    ];

interface ProviderProps<A, B, C, D, E, F, G, H, I, J, K> {
  values: ProviderValues<A, B, C, D, E, F, G, H, I, J, K>;
  children: React.ReactNode;
}

export function Provider<A, B, C, D, E, F, G, H, I, J, K>({
  values,
  children,
}: ProviderProps<A, B, C, D, E, F, G, H, I, J, K>): React.ReactNode {
  for (const [Context, value] of values) {
    // @ts-expect-error ignore
    children = <Context.Provider value={value}>{children}</Context.Provider>;
  }

  return children;
}

export const [GenericSlotContext, useGenericSlotContext] = createContext<SlottedContextValue<any>>({
  name: 'GenericSlotContext',
  strict: false,
});

function isSlottedValue(value: any): value is Required<SlottedValue<any>> {
  return value && typeof value === 'object' && 'slots' in value && value.slots;
}

const getAvailableSlots = (slots: Record<string | symbol, any>) =>
  new Intl.ListFormat().format(Object.keys(slots).map(p => `"${p}"`));

export function useSlottedContext<T>(
  context: React.Context<SlottedContextValue<T>>,
  slot?: string | null,
): T | null | undefined {
  const genericCtx = useGenericSlotContext();
  const ctx = React.useContext(context);

  if (slot === null) {
    // An explicit `null` slot means don't use context.
    return null;
  }

  if (isSlottedValue(genericCtx) || isSlottedValue(ctx)) {
    const genericSlots = isSlottedValue(genericCtx) ? genericCtx.slots : null;
    const compSlots = isSlottedValue(ctx) ? ctx.slots : null;
    const slots = Object.assign({}, genericSlots, compSlots);

    if (!slot && !slots[defaultSlot]) {
      throw new Error(`A slot prop is required. Valid slot names are ${getAvailableSlots(slots)}.`);
    }

    const slotKey = slot || defaultSlot;
    if (!slots[slotKey]) {
      throw new Error(`Invalid slot "${slot}". Valid slot names are ${getAvailableSlots(slots)}.`);
    }

    return slots[slotKey];
  }

  // @ts-expect-error ignore
  return ctx;
}

// export type RefObject<T> = React.RefObject<T | null> | null;

export function useContextProps<T, U extends SlotProps, E extends Element>(
  props: T & SlotProps,
  context: React.Context<ContextValue<U, E>>,
  ref?: React.Ref<E>,
  defaultProps?: Partial<T>,
): [T, React.Ref<E>] {
  const ctx = useSlottedContext(context, props.slot) || {};
  // @ts-expect-error ignore - TS says "Type 'unique symbol' cannot be used as an index type." but not sure why.
  const { ref: contextRef, ...contextProps } = ctx;

  for (const key in defaultProps) {
    // @ts-expect-error ignore
    contextProps[key] = contextProps[key] ?? defaultProps[key];
  }

  const mergedRef = useObjectRef(React.useMemo(() => mergeRefs(ref, contextRef), [ref, contextRef]));
  const mergedProps = mergeProps(contextProps, props) as unknown as T;

  return [mergedProps, mergedRef];
}

/**
 * Merges multiple refs into one. Works with either callback or object refs.
 */
export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.Ref<T> {
  if (refs.length === 1) {
    return refs[0]!;
  }

  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref && ref != null) {
        ref.current = value;
      }
    }
  };
}

/**
 * Offers an object ref for a given callback ref or an object ref. Especially
 * helfpul when passing forwarded refs (created using `React.forwardRef`) to
 * React Aria hooks.
 *
 * @param forwardedRef The original ref intended to be used.
 * @returns An object ref that updates the given ref.
 * @see https://reactjs.org/docs/forwarding-refs.html
 */
export function useObjectRef<T>(forwardedRef?: ((instance: T | null) => void) | React.Ref<T>): React.Ref<T | null> {
  const objRef: React.Ref<T | null> = React.useRef<T>(null);
  return React.useMemo(
    () => ({
      get current() {
        return objRef.current;
      },
      set current(value) {
        objRef.current = value;
        if (typeof forwardedRef === 'function') {
          forwardedRef(value);
        } else if (forwardedRef) {
          forwardedRef.current = value;
        }
      },
    }),
    [forwardedRef],
  );
}
