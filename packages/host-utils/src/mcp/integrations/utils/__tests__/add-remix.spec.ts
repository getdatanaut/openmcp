import { describe, expect, it } from 'vitest';

import { RemixConflict } from '../../../errors/index.ts';
import addRemix from '../add-remix.ts';

describe('addRemix', () => {
  it('should add a remix with the correct name when target does not contain existing remix', () => {
    const target = {};
    const remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };
    const transport = {
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
    };

    addRemix(target, remix, transport);

    expect(target).toHaveProperty('test-remix');
    expect(target['test-remix']).toBe(transport);
  });

  it('should generate a unique name when a remix with the same name already exists', () => {
    const target = {
      'test-remix': {
        command: 'npx',
        args: ['-y', 'openmcp@latest', 'run', '--server', 'another-remix-id'],
      },
    };
    const remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };
    const transport = {
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
    };

    addRemix(target, remix, transport);

    expect(target).toStrictEqual({
      'test-remix': {
        command: 'npx',
        args: ['-y', 'openmcp@latest', 'run', '--server', 'another-remix-id'],
      },
      'test-remix-2': {
        command: 'npx',
        args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
      },
    });
  });

  it('should throw RemixConflict when a remix with the same ID already exists', () => {
    const target = {
      'existing-remix': {
        command: 'npx',
        args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
      },
    };
    const remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };
    const transport = {
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
    };

    expect(() => addRemix(target, remix, transport)).toThrow(new RemixConflict(remix));
    expect(target).toStrictEqual({
      'existing-remix': {
        command: 'npx',
        args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
      },
    });
  });

  it('should properly slugify the remix name', () => {
    const target = {};
    const remix = {
      id: 'test-remix-id',
      name: 'мишка)',
    };
    const transport = {
      command: 'npx',
      args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
    };

    addRemix(target, remix, transport);

    // Check that the transport was assigned to this key
    expect(target).toStrictEqual({
      mishka: {
        args: ['-y', 'openmcp@latest', 'run', '--server', 'test-remix-id'],
        command: 'npx',
      },
    });
  });
});
