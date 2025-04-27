import type { ArgumentsCamelCase } from 'yargs';

import { HandlerError } from '../errors/index.ts';

type Handler<U> = (args: ArgumentsCamelCase<U>) => void | Promise<void>;

export default function createHandler<U, F extends Handler<U> = Handler<U>>(fn: F): F {
  const wrappedFn: Handler<U> = async args => {
    try {
      await fn(args);
    } catch (error) {
      throw new HandlerError(error);
    }
  };

  return wrappedFn as F;
}
