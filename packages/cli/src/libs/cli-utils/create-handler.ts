import type { ArgumentsCamelCase } from 'yargs';

import { HandlerError } from '#errors';
import console from '#libs/console';

type Handler<U> = (args: ArgumentsCamelCase<U>) => void | Promise<void>;

export default function createHandler<U, F extends Handler<U> = Handler<U>>(fn: F): F {
  const wrappedFn: Handler<U> = async args => {
    console.wrapConsole();
    try {
      await fn(args);
    } catch (error) {
      throw new HandlerError(error);
    } finally {
      console.restoreConsole();
    }
  };

  return wrappedFn as F;
}
