import { useInput } from 'ink';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { Option } from '../types.ts';
import useFilteredOptions from './useFilteredOptions.ts';
import useHighlightedIndex from './useHighlightedIndex.ts';
import useSearchInput from './useSearchInput.ts';

interface UseSelectInputBaseOptions {
  /**
   * The list of options to select from
   */
  options: Option[];

  /**
   * Whether to allow multiple selections
   * @default false
   */
  multiple?: boolean;

  /**
   * The initial index to highlight
   * @default 0 for single select, -1 for multi-select (to highlight "All" toggle)
   */
  initialHighlightedIndex?: number;

  /**
   * The minimum index value (can be negative for special items like "All" toggle)
   * @default 0 for single select, -1 for multi-select
   */
  minIndex?: number;

  /**
   * Default value for the search input
   */
  defaultValues?: string[];

  /**
   * Callback when an item is submitted (for single select)
   */
  onSubmit(values: [string, ...string[]]): void;
}

/**
 * Base hook to handle input for select and multi-select components
 */
function useSelectInputBase({
  options,
  multiple = false,
  initialHighlightedIndex,
  minIndex,
  defaultValues = [],
  onSubmit,
}: UseSelectInputBaseOptions) {
  // Set default values based on select mode
  const defaultInitialIndex = multiple ? -1 : 0;
  const defaultMinIndex = multiple ? -1 : 0;

  // Search and filtering
  const { searchQuery, addCharacter, removeCharacter } = useSearchInput('');
  const filteredOptions = useFilteredOptions(options, searchQuery);

  // Highlighting
  const { highlightedIndex, setHighlightedIndex, moveUp, moveDown } = useHighlightedIndex({
    itemsCount: filteredOptions.length,
    initialIndex: initialHighlightedIndex ?? defaultInitialIndex,
    minIndex: minIndex ?? defaultMinIndex,
  });

  // Whether the search input is active
  const inSearchRef = useRef(false);

  // Selection state (for multi-select)
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set(defaultValues));

  const toggleSelection = useCallback((value: string) => {
    setSelectedValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }

      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedValues(prev => {
      // If all items are selected, deselect all
      if (filteredOptions.every(option => prev.has(option.value))) {
        return new Set();
      }
      // Otherwise, select all
      return new Set(filteredOptions.map(option => option.value));
    });
  }, [filteredOptions]);

  const allSelected = useMemo(
    () => filteredOptions.length > 0 && filteredOptions.every(option => selectedValues.has(option.value)),
    [filteredOptions, selectedValues],
  );

  // Handle input
  useInput((input, key) => {
    // Handle backspace
    if (key.backspace || key.delete) {
      removeCharacter();
      return;
    }

    // Handle search input
    if (input && !key.upArrow && !key.downArrow && !key.return && (input !== ' ' || inSearchRef.current)) {
      inSearchRef.current = true;
      setHighlightedIndex(-1);
      addCharacter(input);
      return;
    } else {
      inSearchRef.current = false;
    }

    // Handle navigation
    if (key.upArrow) {
      moveUp(searchQuery.length === 0);
    } else if (key.downArrow) {
      moveDown();
    }

    // Handle selection with space (multi-select only)
    if (multiple && input === ' ') {
      if (highlightedIndex === -1 && searchQuery.length === 0) {
        // Toggle all items
        toggleAll();
      } else if (filteredOptions.length > 0 && highlightedIndex >= 0) {
        const highlightedItem = filteredOptions[highlightedIndex];
        if (highlightedItem) {
          toggleSelection(highlightedItem.value);
        }
      }
    }

    // Handle submission with enter
    if (key.return && !key.shift) {
      if (!multiple && highlightedIndex !== -1) {
        const highlightedItem = filteredOptions[highlightedIndex];
        if (highlightedItem) {
          onSubmit([highlightedItem.value]);
        }
      } else if (selectedValues.size > 0) {
        onSubmit(Array.from(selectedValues) as [string, ...string[]]);
      }
    }
  });

  return useMemo(
    () => ({
      searchQuery,
      filteredOptions,
      highlightedIndex,
      setHighlightedIndex,
      selectedValues,
      allSelected,
      showAllToggle: multiple && searchQuery.length === 0,
    }),
    [searchQuery, filteredOptions, highlightedIndex, setHighlightedIndex, multiple, selectedValues, allSelected],
  );
}

export default useSelectInputBase;
