import type { ColorName } from 'chalk';
import { Box, Text } from 'ink';
import React from 'react';

interface TextRowProps {
  icon: string;
  color: ColorName;
  value: string;
}

const TextRow = React.memo<TextRowProps>(({ icon, color, value }) => {
  return (
    <Box flexDirection="row" columnGap={1}>
      <Box flexShrink={0}>
        <Text>{icon}</Text>
      </Box>
      <Box flexShrink={1}>
        <Text wrap="wrap" bold color={color}>
          {value}
        </Text>
      </Box>
    </Box>
  );
});

export default TextRow;
