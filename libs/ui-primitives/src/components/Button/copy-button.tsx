import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import type { MouseEventHandler } from 'react';

import { useClipboard } from '../../hooks/use-clipboard.ts';
import { Button, type ButtonProps } from './button.tsx';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** If copyText is not provided, you must implement the onClick handler and call copy yourself. */
  copyText?: string;

  /** The second paramter has a `copy` function that you can call to copy the text. */
  onClick?: (evt: Parameters<MouseEventHandler>[0], opts: { copy: (overrideText?: string) => void }) => void;
}

export function CopyButton(props: CopyButtonProps) {
  const { copyText, onClick, ...rest } = props;

  const { hasCopied, copy } = useClipboard(copyText);

  return (
    <Button
      {...rest}
      title="Copy"
      onClick={evt => (onClick ? onClick(evt, { copy }) : copy())}
      overlayIcon={hasCopied ? faCheck : undefined}
      icon={props.children ? undefined : faCopy}
      isInteractive={!hasCopied}
    />
  );
}
