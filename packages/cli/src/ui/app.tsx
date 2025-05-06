import { Box, useInput } from 'ink';
import { observer } from 'mobx-react-lite';
import React from 'react';

import { OperationCanceledError } from '#errors';
import { state } from '#libs/console/prompts';

import Logs from './logs.tsx';
import Prompt from './prompt.tsx';

const App = observer(() => {
  const currentPrompt = state.currentPrompt.get();
  useInput((input, key) => {
    if (input !== 'c' || !key.ctrl) {
      return;
    }

    if (currentPrompt) {
      currentPrompt?.reject(new OperationCanceledError());
    } else {
      process.exit(1);
    }
  });

  return (
    <Box flexDirection="column" rowGap={1}>
      <Logs />
      <Prompt />
    </Box>
  );
});

export default App;
