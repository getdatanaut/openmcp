import type { ArgumentsCamelCase } from 'yargs';

import { HandlerError } from '#errors';
import console from '#libs/console';

import { render } from '../../ui/index.ts';

type Handler<U> = (args: ArgumentsCamelCase<U>) => void | Promise<void>;

export default function createHandler<U, F extends Handler<U> = Handler<U>>(fn: F, ui: boolean): F {
  const wrappedFn: Handler<U> = async args => {
    console.wrapConsole();
    const inkInstance = ui ? render() : null;
    try {
      await fn(args);
    } catch (error) {
      throw new HandlerError(error);
    } finally {
      console.restoreConsole();
      inkInstance?.rerender();
      process.exit(0);
    }
  };

  return wrappedFn as F;
}
