import { useCallback, useMemo, useState } from 'react';

/**
 * Hook to manage search input functionality
 * @param initialQuery Initial search query
 * @returns Object with search query and functions to update it
 */
function useSearchInput(initialQuery: string = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const addCharacter = useCallback((char: string) => {
    setSearchQuery(prev => prev + char);
  }, []);

  const removeCharacter = useCallback(() => {
    setSearchQuery(prev => prev.slice(0, -1));
  }, []);

  const clearQuery = useCallback(() => {
    setSearchQuery('');
  }, []);

  return useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      addCharacter,
      removeCharacter,
      clearQuery,
    }),
    [searchQuery, setSearchQuery, addCharacter, removeCharacter, clearQuery],
  );
}

export default useSearchInput;
