import { Box, Text } from 'ink';
import React from 'react';

interface OptionItemProps {
  /**
   * The label to display
   */
  label: string;

  /**
   * Whether this option is currently highlighted
   */
  isHighlighted: boolean;

  /**
   * Whether this option is currently selected (for multi-select)
   */
  isSelected?: boolean;

  /**
   * Whether to show checkbox (for multi-select)
   */
  showCheckbox?: boolean;
}

/**
 * Component for rendering a single option item in a select list
 */
const OptionItem = React.memo<OptionItemProps>(({ label, isHighlighted, isSelected, showCheckbox = false }) => {
  const checkbox = showCheckbox ? (isSelected ? '✅' : '⬜') : null;

  return (
    <Box>
      {checkbox === null ? null : <Text>{`${checkbox} `}</Text>}
      <Text
        backgroundColor={isHighlighted ? 'blueBright' : undefined}
        color={isHighlighted ? 'whiteBright' : undefined}
        bold={isSelected}
      >
        {label}
      </Text>
    </Box>
  );
});

export default OptionItem;
