import { describe, expect, it, vi } from 'vitest';

import { createObservableRef } from '../ref.ts';

describe('createObservableRef', () => {
  it('should initialize with the provided value', () => {
    const initialValue = 'test';
    const ref = createObservableRef(initialValue);

    expect(ref.get()).toBe(initialValue);
  });

  it('should update the value when set is called', () => {
    const initialValue = 'initial';
    const newValue = 'updated';
    const ref = createObservableRef(initialValue);

    ref.set(newValue);

    expect(ref.get()).toBe(newValue);
  });

  it('should notify subscribers when the value changes', () => {
    const initialValue = 0;
    const newValue = 42;
    const ref = createObservableRef(initialValue);
    const subscriber = vi.fn();

    ref.subscribe(subscriber);
    ref.set(newValue);

    expect(subscriber).toHaveBeenCalledWith(newValue);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should not notify unsubscribed subscribers', () => {
    const ref = createObservableRef('test');
    const subscriber = vi.fn();

    const unsubscribe = ref.subscribe(subscriber);
    unsubscribe();
    ref.set('new value');

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify multiple subscribers', () => {
    const ref = createObservableRef('test');
    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();

    ref.subscribe(subscriber1);
    ref.subscribe(subscriber2);
    ref.set('new value');

    expect(subscriber1).toHaveBeenCalledWith('new value');
    expect(subscriber2).toHaveBeenCalledWith('new value');
  });

  it('should clear all subscribers when disposed', () => {
    const ref = createObservableRef('test');
    const subscriber = vi.fn();

    ref.subscribe(subscriber);
    ref[Symbol.dispose]();
    ref.set('new value');

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should handle complex object values', () => {
    const initialValue = { name: 'John', age: 30 };
    const ref = createObservableRef(initialValue);

    expect(ref.get()).toStrictEqual(initialValue);

    const newValue = { name: 'Jane', age: 25 };
    ref.set(newValue);

    expect(ref.get()).toStrictEqual(newValue);
  });
});
