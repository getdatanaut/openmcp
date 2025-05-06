import { Box, Text } from 'ink';
import React from 'react';

import InputLabel from '../../components/input-label.tsx';
import OptionsList from './components/options-list.tsx';
import SearchDisplay from './components/search-display.tsx';
import useMultiSelectInput from './hooks/useMultiSelectInput.ts';
import type { Option } from './types.ts';

interface IMultiSelectInputProps {
  label: string;
  options: Option[];
  defaultValues?: string[];
  optional?: boolean;
  onSubmit(values: string[]): void;
  /**
   * Maximum number of items to show at once (enables scrolling)
   * @defaultValue 10
   */
  maxVisibleItems?: number;
}

const MultiSelectInput = React.memo<IMultiSelectInputProps>(
  ({ label, options, defaultValues = [], optional = false, onSubmit, maxVisibleItems = 10 }) => {
    const { searchQuery, filteredOptions, highlightedIndex, selectedValues, allSelected, showAllToggle } =
      useMultiSelectInput({
        options,
        defaultValues,
        onSubmit,
      });

    return (
      <Box flexDirection="column">
        <InputLabel
          label={label}
          hint={`Press Space to select, Type to search, Enter to submit${optional ? ' (selection optional)' : ''}`}
        />
        <SearchDisplay searchQuery={searchQuery} />
        <OptionsList
          options={filteredOptions}
          highlightedIndex={highlightedIndex}
          selectedValues={selectedValues}
          showAllToggle={showAllToggle}
          allSelected={allSelected}
          maxVisibleItems={maxVisibleItems}
        />
        <Box>
          <Text>Selected: {Array.from(selectedValues).length} item(s)</Text>
        </Box>
      </Box>
    );
  },
);

export default MultiSelectInput;
