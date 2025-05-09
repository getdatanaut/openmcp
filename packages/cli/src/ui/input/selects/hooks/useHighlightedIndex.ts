import { useEffect, useMemo, useRef, useState } from 'react';

interface UseHighlightedIndexOptions {
  /**
   * The total number of items that can be highlighted
   */
  itemsCount: number;

  /**
   * The initial index to highlight
   * @default 0
   */
  initialIndex?: number;

  /**
   * The minimum index value (can be negative for special items like "All" toggle)
   * @default 0
   */
  minIndex?: number;
}

/**
 * Hook to manage the highlighted index for a list of items
 * Ensures the index stays within bounds when the number of items changes
 */
export default function useHighlightedIndex({
  itemsCount,
  initialIndex = 0,
  minIndex = 0,
}: UseHighlightedIndexOptions) {
  const [highlightedIndex, setHighlightedIndex] = useState(initialIndex);
  const [previousHighlightedIndex, setPreviousHighlightedIndex] = useState(initialIndex);

  // Custom setter to track previous value
  const setHighlightedIndexWithHistory = (newIndex: number | ((prev: number) => number)) => {
    setHighlightedIndex(prevIndex => {
      setPreviousHighlightedIndex(prevIndex);
      return typeof newIndex === 'function' ? newIndex(prevIndex) : newIndex;
    });
  };

  // Ensure highlightedIndex is within bounds when itemsCount changes
  useEffect(() => {
    if (highlightedIndex >= itemsCount && highlightedIndex !== minIndex - 1) {
      setHighlightedIndexWithHistory(Math.max(minIndex, itemsCount - 1));
    }
  }, [itemsCount, highlightedIndex, minIndex]);

  return useMemo(
    () => ({
      highlightedIndex,
      previousHighlightedIndex,
      setHighlightedIndex: setHighlightedIndexWithHistory,

      // Helper functions for navigation
      moveUp: () => {
        setHighlightedIndexWithHistory(prev => Math.max(minIndex, prev - 1));
      },

      moveDown: () => {
        setHighlightedIndexWithHistory(prev => Math.min(itemsCount - 1, prev + 1));
      },
    }),
    [highlightedIndex, previousHighlightedIndex, minIndex, itemsCount],
  );
}
