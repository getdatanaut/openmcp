import { Box, useInput } from 'ink';
import React from 'react';

import { OperationCanceledError } from '#errors';
import { state } from '#libs/console/prompts';
import { useObservable } from '#libs/observable/hooks';

import Logs from './logs.tsx';
import Prompt from './prompt.tsx';

interface AppProps {
  onCancel(): void;
}

const App = React.memo(({ onCancel }: AppProps) => {
  const currentPrompt = useObservable(state.currentPrompt);
  useInput((input, key) => {
    if (input !== 'c' || !key.ctrl) {
      return;
    }

    if (currentPrompt) {
      currentPrompt?.reject(new OperationCanceledError());
    } else {
      onCancel();
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
