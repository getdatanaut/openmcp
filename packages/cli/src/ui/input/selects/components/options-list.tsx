import { Box, Text } from 'ink';
import React from 'react';

import type { Option } from '../types.ts';
import OptionItem from './option-item.tsx';

interface OptionsListProps {
  /**
   * The list of options to display
   */
  options: Option[];

  /**
   * The index of the currently highlighted option
   */
  highlightedIndex: number;

  /**
   * Optional set of selected values (for multi-select)
   */
  selectedValues?: Set<string>;

  /**
   * Whether to show the "All" toggle (for multi-select)
   */
  showAllToggle?: boolean;

  /**
   * Whether all items are selected (for multi-select)
   */
  allSelected?: boolean;

  /**
   * Maximum number of items to show at once (enables scrolling)
   * @default undefined (show all items)
   */
  maxVisibleItems?: number;
}

/**
 * Component for rendering a list of options with highlighting and selection
 */
const OptionsList = React.memo<OptionsListProps>(
  ({ options, highlightedIndex, selectedValues, showAllToggle = false, allSelected = false, maxVisibleItems }) => {
    // Calculate the visible range of options using the hook
    const [startIndex, endIndex] = useVisibleRange(options.length, maxVisibleItems ?? options.length, highlightedIndex);

    const visibleOptions = React.useMemo(() => options.slice(startIndex, endIndex), [startIndex, endIndex, options]);

    // Determine if we need to show scroll indicators
    const hasMoreAbove = startIndex > 0;
    const hasMoreBelow = endIndex < options.length;

    return (
      <Box flexDirection="column" rowGap={1} marginTop={1}>
        {showAllToggle && (
          <OptionItem
            label={`All ${selectedValues?.size && !allSelected ? `(${selectedValues.size}/${options.length})` : ''}`}
            isHighlighted={highlightedIndex === -1}
            isSelected={allSelected}
            showCheckbox={!!selectedValues}
          />
        )}

        {hasMoreAbove && (
          <Box>
            <Text color="gray">↑ {startIndex} more</Text>
          </Box>
        )}

        {visibleOptions.map((option, visibleIndex) => {
          const actualIndex = startIndex + visibleIndex;
          return (
            <OptionItem
              key={option.value}
              label={`${option.label}${option.hint ? ` (${option.hint})` : ''}`}
              isHighlighted={actualIndex === highlightedIndex}
              isSelected={selectedValues?.has(option.value)}
              showCheckbox={!!selectedValues}
            />
          );
        })}

        {hasMoreBelow && (
          <Box>
            <Text color="gray">↓ {options.length - endIndex} more</Text>
          </Box>
        )}
      </Box>
    );
  },
);

export default OptionsList;

/**
 * Hook to calculate the visible range of options for scrolling
 */
const useVisibleRange = (
  optionsLength: number,
  maxVisibleItems: number,
  highlightedIndex: number,
): [number, number] => {
  // Default values (show all options)
  let startIndex = 0;
  let endIndex = optionsLength;

  // Adjust the visible range based on the highlighted index
  if (optionsLength > maxVisibleItems) {
    // Calculate the middle position for the visible window
    const halfVisible = Math.floor(maxVisibleItems / 2);

    // Calculate the start index, ensuring the highlighted item is visible
    startIndex = Math.max(0, highlightedIndex - halfVisible);

    // Ensure we don't go beyond the end of the list
    if (startIndex + maxVisibleItems > optionsLength) {
      startIndex = Math.max(0, optionsLength - maxVisibleItems);
    }

    // Calculate the end index
    endIndex = Math.min(optionsLength, startIndex + maxVisibleItems);
  }

  return [startIndex, endIndex];
};
