/**
 * Credit to djkepa for this hook.
 * https://github.com/djkepa/custom-react-hooks/tree/main/packages/use-element-size
 */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export interface Size {
  width: number;
  height: number;
}

/**
 * `useElementSize` is a hook to measure the size of a DOM element.
 * It tracks the width and height of the element and updates them on window resize or element changes.
 *
 * @param ref - The React ref object attached to the element to measure.
 * @return - An object containing the `width` and `height` of the element.
 */

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [(node: T | null) => void, Size] {
  const [ref, setRef] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const handleSize = useCallback(() => {
    if (ref) {
      setSize({
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
    }
  }, [ref]);

  const useEnviromentEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useEnviromentEffect(() => {
    if (!ref) return;

    handleSize();

    const resizeObserver = new ResizeObserver(handleSize);
    resizeObserver.observe(ref);

    return () => resizeObserver.disconnect();
  }, [ref, handleSize]);

  return [setRef, size];
}
