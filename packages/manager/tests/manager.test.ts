import { describe, expect, it } from 'vitest';

import { createMpcManager } from '../src/manager.ts';

describe('createManager()', () => {
  it.only('should create a manager', async () => {
    const manager = createMpcManager();

    await manager.servers.create({
      id: 'test',
      name: 'Test Server',
      version: '1.0.0',
      transport: {
        type: 'inMemory',
        config: {},
      },
    });

    expect(manager).toBeDefined();
    expect((await manager.servers.findMany()).length).toBe(1);
    expect(await manager.servers.get({ id: 'test' })).toBeDefined();
  });
});
