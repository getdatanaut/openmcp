import { describe, expect, it } from 'vitest';

import { RemixNotInstalled } from '../../../errors/index.ts';
import deleteRemix from '../delete-remix.ts';

describe('deleteRemix', () => {
  it('should delete a remix when it exists in servers', () => {
    const servers = {
      server1: {
        command: 'npx',
        args: ['-y', '@openmcp/cli', 'run', '--server', 'test-remix-id'],
      },
      server2: {
        command: 'npx',
        args: ['-y', '@openmcp/cli', 'run', '--server', 'other-remix-id'],
      },
    };

    const remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    deleteRemix(servers, remix);

    expect(servers).toStrictEqual({
      server2: {
        command: 'npx',
        args: ['-y', '@openmcp/cli', 'run', '--server', 'other-remix-id'],
      },
    });
  });

  it('should throw RemixNotInstalled when remix does not exist in servers', () => {
    const servers = {
      server1: {
        command: 'npx',
        args: ['@openmcp/cli', 'run', '--server', 'other-remix-id'],
      },
    };

    const remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(() => deleteRemix(servers, remix)).toThrow(new RemixNotInstalled(remix));
  });

  it('should throw RemixNotInstalled when servers is nil', () => {
    const remix = {
      id: 'test-remix-id',
      name: 'Test Remix',
    };

    expect(() => deleteRemix(null, remix)).toThrow(new RemixNotInstalled(remix));
    expect(() => deleteRemix(undefined, remix)).toThrow(new RemixNotInstalled(remix));
  });
});
