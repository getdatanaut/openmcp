import { isCancel } from '@clack/prompts';

import { OperationCancelled } from './errors.ts';

export function assertFulfilled<V>(res: V): asserts res is V extends symbol ? never : V {
  if (isCancel(res)) {
    throw new OperationCancelled();
  }
}

export function isOperationCancelled(err: unknown): err is OperationCancelled {
  return err instanceof OperationCancelled;
}
