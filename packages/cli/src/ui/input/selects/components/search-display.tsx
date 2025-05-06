import { Box, Text } from 'ink';
import React from 'react';

interface SearchDisplayProps {
  /**
   * The current search query
   */
  searchQuery: string;
}

/**
 * Component for displaying the current search query
 */
const SearchDisplay = React.memo<SearchDisplayProps>(({ searchQuery }) => {
  if (searchQuery.length === 0) {
    return null;
  }

  return (
    <Box>
      <Text>Search: </Text>
      <Text>{searchQuery}</Text>
    </Box>
  );
});

export default SearchDisplay;
