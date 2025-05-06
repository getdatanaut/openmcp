import { Box, Text, useInput } from 'ink';
import React, { useState } from 'react';

interface IConfirmInputProps {
  label: string;
  defaultValue?: boolean;
  onSubmit(value: boolean): void;
}

const ConfirmInput = React.memo<IConfirmInputProps>(({ defaultValue = true, label, onSubmit }) => {
  const [value, setValue] = useState(defaultValue);

  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
      setValue(true);
    } else if (input === 'n' || input === 'N') {
      setValue(false);
    } else if (key.return) {
      onSubmit(value);
    }
  });

  return (
    <Box flexDirection="row" columnGap={1}>
      <Text>{value ? '✅' : '❌'}</Text>
      <Text bold wrap="truncate-end" color={value ? 'greenBright' : 'red'}>
        {label}
      </Text>
      <Text dimColor>{value ? '(Y/n)' : '(y/N)'}</Text>
    </Box>
  );
});

export default ConfirmInput;
