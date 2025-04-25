import EventEmitter from 'node:events';

import type { ReadonlyKeysOf } from 'type-fest';

import prettyStringify from '../../utils/pretty-stringify.ts';

export type OmitReadonly<T> = Omit<T, ReadonlyKeysOf<T>>;

type ChunkEventMap = {
  add: [key: string, value: unknown];
  change: [key: string, prev: unknown, value: unknown];
};

export abstract class Chunk<K, D extends {}> implements Disposable {
  readonly kind: K;
  protected readonly data: D;
  readonly events: EventEmitter<ChunkEventMap>;

  protected constructor(kind: K, data: D) {
    this.kind = kind;
    this.data = data;
    this.events = new EventEmitter<ChunkEventMap>();
  }

  toString() {
    return prettyStringify(this.data);
  }

  set<N extends keyof OmitReadonly<D> & string>(name: N, value: NonNullable<D[N]>) {
    if (this.data[name] === value) return;

    if (Object.hasOwn(this.data, name) && this.data[name] !== undefined) {
      this.events.emit('change', name, this.data[name], value);
    } else {
      this.events.emit('add', name, value);
    }

    this.data[name] = value;
  }

  abstract add(name: Exclude<string, keyof D>, value: unknown);

  [Symbol.dispose]() {
    this.events.removeAllListeners();
  }
}
