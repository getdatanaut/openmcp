import copyToClipboard from 'copy-to-clipboard-ultralight';
import { useCallback, useEffect, useState } from 'react';

/**
 * A hook to aid with copying content to the user's clipboard.
 *
 * @param text - The text to copy to the clipboard.
 * @param timeout - The amount of time in milliseconds to keep `hasCopied` as true, after `copy` has been called.
 * @returns An object with the copied text, a function to copy the text, and a boolean `hasCopied` indicating if the text has been recently copied.
 *
 * @example
 * ```tsx
 * const CopyButton = ({ text }) => {
 *   const { hasCopied, copy } = useClipboard(text);
 *
 *   return <Button onClick={copy}>{hasCopied ? 'Copied' : 'Click to Copy'}</Button>;
 * };
 * ```
 */
export function useClipboard(text?: string, timeout = 1500) {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(
    (overrideText?: string) => {
      const didCopy = copyToClipboard(overrideText ?? text);
      setHasCopied(didCopy);
    },
    [text],
  );

  useEffect(() => {
    if (hasCopied) {
      const id = setTimeout(() => {
        setHasCopied(false);
      }, timeout);

      return () => clearTimeout(id);
    }
  }, [timeout, hasCopied]);

  return { value: text, copy, hasCopied };
}
