import { Box, Text } from 'ink';
import _TextInput from 'ink-text-input';
import React, { useCallback, useState } from 'react';

import InputLabel from '../components/input-label.tsx';

interface TextInputProps {
  label: string;
  placeholder?: string;
  hint?: string;
  mask?: string;
  defaultValue?: string;
  validate?(value: string): string | void;
  onSubmit(value: string): void;
}

const TextInput = React.memo<TextInputProps>(
  ({ defaultValue = '', placeholder, label, mask, hint, validate, onSubmit }) => {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState<string | null>(null);

    const validateInput = useCallback(
      (val: string) => {
        const validationResult = validate?.(val);
        if (validationResult) {
          setError(validationResult);
          return false;
        }

        setError(null);
        return true;
      },
      [validate],
    );

    const handleChange = useCallback(
      (val: string) => {
        setValue(val);
        // validateInput(val);
      },
      [validateInput],
    );

    const handleSubmit = useCallback(
      (val: string) => {
        if (defaultValue === val || validateInput(val)) {
          onSubmit(val);
        }
      },
      [onSubmit, validateInput],
    );

    return (
      <Box flexDirection="column">
        <InputLabel label={label} hint={hint} />
        <Box paddingLeft={3} flexDirection="column">
          <_TextInput
            mask={mask}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
          {error ? (
            <Text bold color="red">
              {error}
            </Text>
          ) : null}
        </Box>
      </Box>
    );
  },
);

export default TextInput;
