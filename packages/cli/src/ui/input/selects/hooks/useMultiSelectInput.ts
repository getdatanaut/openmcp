import { useMemo } from 'react';

import type { Option } from '../types.ts';
import useSelectInputBase from './useSelectInputBase.ts';

interface UseMultiSelectInputOptions {
  /**
   * The list of options to select from
   */
  options: Option[];

  /**
   * The initial selected values
   * @default []
   */
  defaultValues?: string[];

  /**
   * Callback when values are submitted
   */
  onSubmit(values: string[]): void;
}

/**
 * Hook to handle input for multi-select components
 */
function useMultiSelectInput({ options, defaultValues = [], onSubmit }: UseMultiSelectInputOptions) {
  const result = useSelectInputBase({
    options,
    multiple: true,
    defaultValues,
    onSubmit,
  });

  return useMemo(
    () => ({
      searchQuery: result.searchQuery,
      filteredOptions: result.filteredOptions,
      highlightedIndex: result.highlightedIndex,
      selectedValues: result.selectedValues,
      allSelected: result.allSelected,
      showAllToggle: result.showAllToggle,
    }),
    [result],
  );
}

export default useMultiSelectInput;
