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
    if (searchQuery.length === 0) {
      return options;
    }

    return options.filter(option => {
      const query = searchQuery.toLowerCase();
      return option.label.toLowerCase().includes(query) || option.hint?.toLowerCase().includes(query);
    });
  }, [searchQuery, options]);
}
