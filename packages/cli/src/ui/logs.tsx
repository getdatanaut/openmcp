import type { ColorName } from 'chalk';
import { Box } from 'ink';
import React from 'react';

import { logs, type LogType } from '#libs/console/reporters/fancy';
import { useObservable } from '#libs/observable/hooks';

import TextRow from './components/text-row.tsx';

const COLORS_MAP = {
  success: 'green',
  error: 'red',
  info: 'blue',
  start: 'cyanBright',
  warn: 'yellow',
  verbose: 'gray',
} as const satisfies Record<LogType, ColorName>;

const ICONS_MAP = {
  success: '🌟',
  error: '💥',
  info: '💡',
  start: '🚀',
  warn: '⚠️',
  verbose: '📝',
} as const satisfies Record<LogType, string>;

const Logs = React.memo(() => {
  const logEntries = useObservable(logs);
  return (
    <Box flexDirection="column" rowGap={1}>
      {logEntries.map(log => (
        <TextRow key={log.id} icon={ICONS_MAP[log.type]} color={COLORS_MAP[log.type]} value={log.message} />
      ))}
    </Box>
  );
});

export default Logs;
