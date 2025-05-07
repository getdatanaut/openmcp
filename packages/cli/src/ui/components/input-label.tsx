import { Box, Text } from 'ink';
import React from 'react';

import TextRow from './text-row.tsx';

interface InputLabelProps {
  /**
   * The label text to display
   */
  label: string;

  /**
   * Optional hint text to display below the label
   */
  hint?: string;
}

/**
 * Component for rendering a consistent label and hint for input components
 */
const InputLabel = React.memo<InputLabelProps>(({ label, hint }) => {
  return (
    <Box flexDirection="column">
      <TextRow icon={'👇'} color="blue" value={label} />
      {hint ? (
        <Box paddingLeft={3}>
          <Text color="gray" wrap="wrap">
            {hint}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
});

export default InputLabel;
