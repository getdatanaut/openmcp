import { useMemo } from 'react';

import type { Option } from '../types.ts';

/**
 * Hook to filter options based on a search query
 * @param options The list of options to filter
 * @param searchQuery The search query to filter by
 * @returns The filtered list of options
 */
export default function useFilteredOptions(options: Option[], searchQuery: string): Option[] {
  return useMemo(() => {
    if (!searchQuery) {
      return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, options]);
}

