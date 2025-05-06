import { useMemo } from 'react';

import type { Option } from '../types.ts';
import useSelectInputBase from './useSelectInputBase.ts';

interface UseSelectInputOptions {
  /**
   * The list of options to select from
   */
  options: Option[];

  /**
   * The initial index to highlight
   * @default 0
   */
  initialHighlightedIndex?: number;

  /**
   * The minimum index value (can be negative for special items like "All" toggle)
   * @default 0
   */
  minIndex?: number;

  /**
   * Default value for the search input
   * @default ''
   */
  defaultValue?: string;

  /**
   * Callback when an item is submitted
   */
  onSubmit(value: string): void;
}

/**
 * Hook to handle input for select components
 */
export default function useSelectInput({
  options,
  initialHighlightedIndex = 0,
  minIndex = 0,
  defaultValue = '',
  onSubmit,
}: UseSelectInputOptions) {
  const result = useSelectInputBase({
    options,
    multiple: false,
    initialHighlightedIndex,
    minIndex,
    defaultValues: defaultValue ? [defaultValue] : [],
    onSubmit([value]) {
      onSubmit(value);
    },
  });

  return useMemo(
    () => ({
      searchQuery: result.searchQuery,
      filteredOptions: result.filteredOptions,
      highlightedIndex: result.highlightedIndex,
      setHighlightedIndex: result.setHighlightedIndex,
    }),
    [result],
  );
}
