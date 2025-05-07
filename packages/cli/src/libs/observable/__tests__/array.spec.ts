import { describe, expect, it, vi } from 'vitest';

import { createShallowObservableArray } from '../array.ts';

describe('createShallowObservableArray', () => {
  it('should initialize with the provided values', () => {
    const initialValues = [1, 2, 3];
    const array = createShallowObservableArray(initialValues);

    expect(array.get()).toStrictEqual(initialValues);
    expect(array.length).toBe(initialValues.length);
  });

  it('should return a copy of the array when get is called', () => {
    const initialValues = [1, 2, 3];
    const array = createShallowObservableArray(initialValues);

    const result = array.get();

    // Verify it's a different array instance
    expect(result).not.toBe(initialValues);
    // But with the same values
    expect(result).toStrictEqual(initialValues);
  });

  it('should add items when push is called', () => {
    const initialValues = [1, 2, 3];
    const array = createShallowObservableArray(initialValues);

    array.push(4, 5);

    expect(array.get()).toStrictEqual([1, 2, 3, 4, 5]);
    expect(array.length).toBe(5);
  });

  it('should return the new length when push is called', () => {
    const array = createShallowObservableArray([1, 2]);

    const newLength = array.push(3);

    expect(newLength).toBe(3);
  });

  it('should notify subscribers when items are pushed', () => {
    const array = createShallowObservableArray([1, 2]);
    const subscriber = vi.fn();

    array.subscribe(subscriber);
    array.push(3);

    expect(subscriber).toHaveBeenCalledWith([1, 2, 3]);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should not notify unsubscribed subscribers', () => {
    const array = createShallowObservableArray([1, 2]);
    const subscriber = vi.fn();

    const unsubscribe = array.subscribe(subscriber);
    unsubscribe();
    array.push(3);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify multiple subscribers', () => {
    const array = createShallowObservableArray([1, 2]);
    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();

    array.subscribe(subscriber1);
    array.subscribe(subscriber2);
    array.push(3);

    expect(subscriber1).toHaveBeenCalledWith([1, 2, 3]);
    expect(subscriber2).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should clear all subscribers when disposed', () => {
    const array = createShallowObservableArray([1, 2]);
    const subscriber = vi.fn();

    array.subscribe(subscriber);
    array[Symbol.dispose]();
    array.push(3);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should handle complex object values', () => {
    const initialValues = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];
    const array = createShallowObservableArray(initialValues);

    expect(array.get()).toStrictEqual(initialValues);

    array.push({ id: 3, name: 'Item 3' });

    expect(array.get()).toStrictEqual([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ]);
  });

  it('should provide a copy to subscribers to prevent mutation', () => {
    const array = createShallowObservableArray([1, 2]);
    let receivedArray: number[] = [];

    array.subscribe(arr => {
      receivedArray = arr;
    });

    array.push(3);

    // Mutate the received array
    receivedArray.push(4);

    // Original array should not be affected
    expect(array.get()).toStrictEqual([1, 2, 3]);
  });
});
