import { tryCatch } from '@maxmorozoff/try-catch-tuple';
import type { PromiseWithServerResult, Zero } from '@rocicorp/zero';
import { useCallback, useState } from 'react';
import type { ZodError } from 'zod';

import type { Mutators } from '~shared/zero-mutators.ts';
import type { Schema } from '~shared/zero-schema.ts';

import { useZero } from './use-zero.ts';

/**
 * A React hook for managing mutations with both client-side optimistic updates
 * and server-side confirmation, along with lifecycle callbacks.
 *
 * It handles the pending state and provides a `mutate` function to trigger the operation.
 * The mutation logic is defined in a callback function (`cb`) which can return
 * different structures depending on whether the setup is synchronous or asynchronous,
 * and whether lifecycle hooks are needed.
 *
 * @param cb The callback function defining the mutation. It receives the Zero client instance (`z`) and an optional argument (`arg`).
 *   It can return:
 *   1. `MutatioCallbackWithHooks`: For sync setup with lifecycle hooks.
 *      The `op` property must be a `PromiseWithServerResult`.
 *   2. `PromiseWithServerResult`: For simple mutations (sync or async setup) without extra lifecycle hooks.
 *   3. `Promise<MutatioCallbackWithHooks>`: For async setup where the hooks object is returned later.
 * @param deps React dependency list for the `useCallback` wrapping the `mutate` function.
 * @returns An object containing:
 *   - `mutate`: The function to trigger the mutation. Takes an argument if `TArg` is not void.
 *   - `isPending`: A boolean indicating if the mutation is currently in progress.
 *
 * @example
 * // Example 1: Sync setup with hooks
 * const { mutate: updateUser, isPending } = useMutation(async (z, { userId, name }) => {
 *   return {
 *     op: z.mutate.user.update({ id: userId, name }),
 *     onClientSuccess: () => console.log('Client update applied!'),
 *     onClientError: (err) => console.error('Client update failed:', err),
 *     onServerSuccess: (result) => console.log('Server confirmed update:', result),
 *     onServerError: (err) => console.error('Server update failed:', err),
 *   };
 * }, []);
 *
 * // Example 2: Simple mutation (returning PromiseWithServerResult directly)
 * const { mutate: deleteItem, isPending: isDeleting } = useMutation((z, itemId) => {
 *   // No extra hooks needed, just return the operation promise
 *   return z.mutate.items.delete(itemId);
 * }, []);
 *
 * // Example 3: Async setup (returning Promise<MutatioCallbackWithHooks>)
 * const { mutate: complexAction, isPending: isComplexPending } = useMutation(async (z, data) => {
 *   // Perform some async setup first
 *   const preppedData = await prepareData(data);
 *   return {
 *     op: z.mutate.complex.create(preppedData),
 *     onClientSuccess: () => console.log('...'),
 *     // ... other hooks
 *   };
 * }, []);
 */
export function useZeroMutation<TArg = void>(
  cb: MutationCallback<TArg>,
  deps: React.DependencyList,
): { mutate: MutateFunction<TArg>; isPending: boolean } {
  const z = useZero();

  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (arg?: TArg) => {
      setIsPending(true);

      try {
        const cbRes = cb(z, arg as TArg);

        let hooks: MutatioCallbackWithHooks | undefined = undefined;
        let op: PromiseWithServerResult | undefined = undefined;

        if (isPromiseWithServerResult(cbRes)) {
          // Case 1: PromiseWithServerResult
          op = cbRes;
        } else if (cbRes instanceof Promise) {
          // Case 2: Promise<MutatioCallbackWithHooks>
          const [resolvedHooks, initialError] = await tryCatch(cbRes as Promise<MutatioCallbackWithHooks>);

          if (initialError || !resolvedHooks) {
            throw initialError ?? new Error('Async callback resolving to hooks failed or returned null/undefined');
          }
          if (!isMutationCallbackWithHooks(resolvedHooks)) {
            throw new Error(
              `Async callback was expected to resolve to MutatioCallbackWithHooks, but got: ${typeof resolvedHooks}`,
            );
          }
          hooks = resolvedHooks;
          op = hooks.op;
        } else if (isMutationCallbackWithHooks(cbRes)) {
          // Case 3: MutatioCallbackWithHooks (Sync)
          hooks = cbRes;
          op = hooks.op;
        }

        // At this point, op should be a valid PromiseWithServerResult
        if (!op) {
          // This check is mostly for type safety, should be unreachable if logic above is correct
          throw new Error('Mutation callback returned an unexpected type.');
        }

        // --- Client-side operation execution ---
        const [, clientError] = await tryCatch(op);

        if (clientError) {
          console.error('Client mutation error:', clientError);
          hooks?.onClientError?.(clientError);
          return;
        }

        // --- Client operation successful ---
        hooks?.onClientSuccess?.();

        // --- Server-side operation execution ---
        const [serverResult, unknownServerError] = await tryCatch(op.server);

        if (unknownServerError) {
          console.error('Unknown server mutation error:', unknownServerError);
          hooks?.onServerError?.(unknownServerError as Error);
          return;
        }

        if (isMutationError(serverResult)) {
          console.error('Server mutation error:', serverResult);
          hooks?.onServerError?.(serverResult);
          return;
        }

        // --- Server operation successful ---
        hooks?.onServerSuccess?.(serverResult);
      } catch (err: unknown) {
        console.error('Error during mutation execution:', err);
      } finally {
        setIsPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, z],
  );

  // The return type is correctly inferred based on TArg
  return { mutate: mutate as MutateFunction<TArg>, isPending };
}

export function isMutationError(res: unknown): res is ServerMutationError {
  return typeof res === 'object' && res !== null && 'error' in res;
}

function isPromiseWithServerResult(value: unknown): value is PromiseWithServerResult {
  return (
    value instanceof Promise &&
    typeof value === 'object' && // Ensure value is an object before checking 'server'
    value !== null &&
    'server' in value
  );
}

function isMutationCallbackWithHooks(
  res: PromiseWithServerResult | MutatioCallbackWithHooks,
): res is MutatioCallbackWithHooks {
  // This guard operates on the *resolved* value or the sync return,
  // so it doesn't need to check for Promise itself.
  return typeof res === 'object' && res !== null && 'op' in res;
}

// --- Types ---

type ServerMutationError = { error: 'app' | 'oooMutation'; details?: Record<string, unknown> };

type MutatioCallbackWithHooks = {
  op: PromiseWithServerResult;
  onClientSuccess?: () => void;
  onClientError?: (error: Error) => void;
  onServerSuccess?: (result: unknown) => void;
  onServerError?: (error: ServerMutationError | ZodError | Error) => void;
};

type MutationCallbackRes = Promise<MutatioCallbackWithHooks> | PromiseWithServerResult | MutatioCallbackWithHooks;

type MutationCallback<TArg = void> = (z: Zero<Schema, Mutators>, arg: TArg) => MutationCallbackRes;

type MutateFunction<TArg = void> = TArg extends void ? () => Promise<void> : (arg: TArg) => Promise<void>;
