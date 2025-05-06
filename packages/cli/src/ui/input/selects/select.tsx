import { Box } from 'ink';
import React from 'react';

import InputLabel from '../../components/input-label.tsx';
import OptionsList from './components/options-list.tsx';
import SearchDisplay from './components/search-display.tsx';
import useSelectInput from './hooks/useSelectInput.ts';
import type { Option } from './types.ts';

interface ISelectInputProps {
  label: string;
  options: Option[];
  defaultValue?: string;
  onSubmit(value: string): void;
  /**
   * Maximum number of items to show at once (enables scrolling)
   * @defaultValue 10
   */
  maxVisibleItems?: number;
}

const SelectInput = React.memo<ISelectInputProps>(
  ({ label, options, defaultValue = '', onSubmit, maxVisibleItems = 10 }) => {
    const { searchQuery, filteredOptions, highlightedIndex } = useSelectInput({
      options,
      defaultValue,
      onSubmit,
    });

    return (
      <Box flexDirection="column">
        <InputLabel label={label} hint="Type to search, Enter to submit" />
        <Box paddingLeft={3} flexDirection="column">
          <SearchDisplay searchQuery={searchQuery} />
          <OptionsList
            options={filteredOptions}
            highlightedIndex={highlightedIndex}
            maxVisibleItems={maxVisibleItems}
          />
        </Box>
      </Box>
    );
  },
);

export default SelectInput;
