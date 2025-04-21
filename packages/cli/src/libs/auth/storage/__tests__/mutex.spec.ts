import { describe, expect, it, vi } from 'vitest';

import Mutex from '../mutex.ts';

describe('Mutex', () => {
  it('should execute functions sequentially', async () => {
    const mutex = new Mutex();
    const results: number[] = [];

    // Create a function that simulates an async operation
    const createAsyncOperation = (delay: number, value: number) => async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      results.push(value);
      return value;
    };

    // Start multiple operations concurrently
    const operation1 = mutex.lock(createAsyncOperation(50, 1));
    const operation2 = mutex.lock(createAsyncOperation(10, 2));
    const operation3 = mutex.lock(createAsyncOperation(30, 3));

    // Wait for all operations to complete
    await Promise.all([operation1, operation2, operation3]);

    // Even though operation2 has the shortest delay, the operations should be executed in the order they were locked
    expect(results).toEqual([1, 2, 3]);
  });

  it('should return the result of the executed function', async () => {
    const mutex = new Mutex();

    const result = await mutex.lock(async () => {
      return 'test result';
    });

    expect(result).toBe('test result');
  });

  it('should release the lock after the function completes', async () => {
    const mutex = new Mutex();
    const executionOrder: string[] = [];

    // First operation
    await mutex.lock(async () => {
      executionOrder.push('first operation start');
      await new Promise(resolve => setTimeout(resolve, 10));
      executionOrder.push('first operation end');
    });

    // Second operation should start after the first one completes
    await mutex.lock(async () => {
      executionOrder.push('second operation');
    });

    expect(executionOrder).toEqual(['first operation start', 'first operation end', 'second operation']);
  });

  it('should release the lock even if the function throws an error', async () => {
    const mutex = new Mutex();
    const executionOrder: string[] = [];

    // First operation that throws an error
    try {
      await mutex.lock(async () => {
        executionOrder.push('error operation start');
        throw new Error('Test error');
      });
    } catch (error) {
      executionOrder.push('error caught');
    }

    // Second operation should still be able to acquire the lock
    await mutex.lock(async () => {
      executionOrder.push('operation after error');
    });

    expect(executionOrder).toEqual(['error operation start', 'error caught', 'operation after error']);
  });

  it('should be reusable after being released', async () => {
    const mutex = new Mutex();
    const executionOrder: string[] = [];

    // First lock
    await mutex.lock(async () => {
      executionOrder.push('first lock');
    });

    // Second lock (should be able to acquire after the first is released)
    await mutex.lock(async () => {
      executionOrder.push('second lock');
    });

    // Third lock
    await mutex.lock(async () => {
      executionOrder.push('third lock');
    });

    expect(executionOrder).toEqual(['first lock', 'second lock', 'third lock']);
  });

  it('should work with multiple concurrent lock requests', async () => {
    const mutex = new Mutex();
    const spy = vi.fn();

    // Create 10 concurrent lock requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      mutex.lock(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        spy(i);
        return i;
      }),
    );

    // Wait for all to complete
    const results = await Promise.all(promises);

    // Check that all functions were called
    expect(spy).toHaveBeenCalledTimes(10);

    // Check that results are in the expected order
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Check that the calls were made in sequence
    for (let i = 0; i < 9; i++) {
      expect(spy.mock.invocationCallOrder[i]).toBeLessThan(spy.mock.invocationCallOrder[i + 1]!);
    }
  });
});
