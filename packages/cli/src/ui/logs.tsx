import type { ColorName } from 'chalk';
import { Box } from 'ink';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { logs, type LogType } from '#libs/console/reporters/fancy';

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

const Logs = observer(() => (
  <Box flexDirection="column" rowGap={1}>
    {logs.map(log => (
      <TextRow key={log.id} icon={ICONS_MAP[log.type]} color={COLORS_MAP[log.type]} value={log.message} />
    ))}
  </Box>
));

export default Logs;
