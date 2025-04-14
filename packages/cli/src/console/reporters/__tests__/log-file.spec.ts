import { createConsola } from 'consola/core';
import { describe, expect, it, vi } from 'vitest';

import logFileReporter from '../log-file.ts';

describe('logFileReporter', () => {
  it('should write log message to stdout for relevant log types', () => {
    const stdoutMock = { write: vi.fn() };
    const consola = createConsola({
      stdout: stdoutMock as any,
      reporters: [logFileReporter],
    });

    consola.info('info message', 0);
    consola.log('log message', 2);

    expect(stdoutMock.write).toHaveBeenCalledTimes(2);
    expect(stdoutMock.write.mock.calls).toEqual([
      [
        expect.stringMatching(
          /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} \+\d{2}:\d{2}]\s\[INFO]\sinfo message\s0\n/,
        ),
      ],
      [
        expect.stringMatching(
          /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} \+\d{2}:\d{2}]\s\[LOG]\slog message\s2\n/,
        ),
      ],
    ]);
  });

  it('should write log message to stderr for error log types', () => {
    const stderrMock = { write: vi.fn() };
    const consola = createConsola({
      stderr: stderrMock as any,
      reporters: [logFileReporter],
    });

    consola.error('error message', new Error('some error'));

    expect(stderrMock.write.mock.calls).toEqual([
      [
        expect.stringMatching(
          /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} \+\d{2}:\d{2}]\s\[ERROR]\serror message\sError: some error\n/,
        ),
      ],
    ]);
  });

  it('should handle missing stdout and stderr gracefully', () => {
    const consola = createConsola({
      reporters: [logFileReporter],
    });

    expect(() => consola.error('error')).not.toThrow();
  });
});
