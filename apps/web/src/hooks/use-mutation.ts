import { tryCatch } from '@maxmorozoff/try-catch-tuple';
import type { PromiseWithServerResult, Zero } from '@rocicorp/zero';
import { useCallback, useState } from 'react';
import type { ZodError } from 'zod';

import type { Mutators } from '~shared/zero-mutators.ts';
import type { Schema } from '~shared/zero-schema.ts';

import { useZero } from './use-zero.ts';

export function isMutationError(res: unknown): res is ServerMutationError {
  return typeof res === 'object' && res !== null && 'error' in res;
}

type ServerMutationError = { error: 'app' | 'oooMutation'; details?: Record<string, unknown> };

type MutatioCallbackWithHooks = {
  op: PromiseWithServerResult;
  onClientSuccess?: () => void;
  onClientError?: (error: Error) => void;
  onServerSuccess?: (result: unknown) => void;
  onServerError?: (error: ServerMutationError | ZodError | Error) => void;
};

type MutationCallbackRes =
  | Promise<PromiseWithServerResult | MutatioCallbackWithHooks>
  | PromiseWithServerResult
  | MutatioCallbackWithHooks;

type MutationCallback<TArg = void> = (z: Zero<Schema, Mutators>, arg: TArg) => MutationCallbackRes;

type MutateFunction<TArg = void> = TArg extends void ? () => Promise<void> : (arg: TArg) => Promise<void>;

function isMutationCallbackWithHooks(
  res: PromiseWithServerResult | MutatioCallbackWithHooks,
): res is MutatioCallbackWithHooks {
  return typeof res === 'object' && res !== null && 'op' in res;
}

// @TODO proper error handling
export function useMutation<TArg = void>(
  cb: MutationCallback<TArg>,
  deps: React.DependencyList,
): { mutate: MutateFunction<TArg>; isPending: boolean } {
  const z = useZero();

  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (arg?: TArg) => {
      setIsPending(true);

      const cbRes = cb(z, arg as TArg);

      // Await the callback result if it's a promise, using tryCatch for error handling
      const [resolvedCbRes, initialError] = await tryCatch(cbRes instanceof Promise ? cbRes : Promise.resolve(cbRes));

      // Handle errors during callback resolution (sync, async rejection, or resolving to undefined)
      if (initialError || resolvedCbRes === undefined) {
        console.error(
          'Error resolving mutation callback:',
          initialError ?? new Error('Callback resolved to undefined'),
        );

        // Note: We can't reliably call hooks.onClientError here as we don't know
        // if the resolved type *would* have been MutatioCallbackWithHooks if it hadn't errored.
        setIsPending(false);
        return;
      }

      // Now resolvedCbRes is guaranteed to be PromiseWithServerResult | MutatioCallbackWithHooks
      const hooks = isMutationCallbackWithHooks(resolvedCbRes) ? resolvedCbRes : undefined;
      // Ensure op is correctly typed as PromiseWithServerResult
      const op: PromiseWithServerResult = isMutationCallbackWithHooks(resolvedCbRes) ? resolvedCbRes.op : resolvedCbRes;

      // --- Client-side operation execution ---
      const [, clientError] = await tryCatch(op); // Await the client-side promise to catch errors

      if (clientError) {
        console.error('Client mutation error:', clientError);
        hooks?.onClientError?.(clientError);
        setIsPending(false);
        return;
      }

      hooks?.onClientSuccess?.();

      // --- Server-side operation execution ---
      const [serverResult, serverError] = await tryCatch(op.server); // Await the server-side promise

      if (serverError) {
        console.error('Server mutation error:', serverError);
        // Pass the error to the hook, assuming the hook can handle the potential types
        hooks?.onServerError?.(serverError as ServerMutationError | ZodError | Error);
        setIsPending(false);
        return;
      }

      hooks?.onServerSuccess?.(serverResult);

      setIsPending(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  // The return type is correctly inferred based on TArg
  return { mutate: mutate as MutateFunction<TArg>, isPending };
}
