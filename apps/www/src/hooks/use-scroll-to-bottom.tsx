import { type RefObject, useCallback, useEffect, useRef } from 'react';

export function useScrollToBottom(
  props: {
    /** The container that has overflow-y set on it */
    scrollContainerRef?: RefObject<HTMLDivElement | null>;
    /** The child container - scrollToBottom will watch the hight of this container for changes, and scroll to endRef when it changes */
    containerRef?: RefObject<HTMLDivElement | null>;
    /** The ref to element positioned at the bottom of scrollContainerRef */
    endRef?: RefObject<HTMLDivElement | null>;
    /** The number of pixels at the bottom of the container to consider for auto scrolling */
    graceAmount?: number;
    /** The key to reset the scroll state */
    resetKey?: string;
  } = {},
) {
  const { scrollContainerRef, graceAmount = 50 } = props;

  let containerRef = useRef<HTMLDivElement | null>(null);
  let endRef = useRef<HTMLDivElement | null>(null);
  let canAutoScroll = useRef(true);
  let prevScrollTop = useRef(0);

  let isProgrammaticScroll = useRef(false);
  let programmaticScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  let hasScrolledInitially = useRef(false);
  let resizeCount = useRef(0);

  let isMouseWheelScroll = useRef(false);
  let mouseWheelScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (props.containerRef) {
    containerRef = props.containerRef;
  }

  if (props.endRef) {
    endRef = props.endRef;
  }

  const scrollToBottom = useCallback(({ behavior = 'instant' }: { behavior?: ScrollBehavior } = {}) => {
    if (!endRef.current) return;

    if (programmaticScrollTimeout.current) {
      clearTimeout(programmaticScrollTimeout.current);
      programmaticScrollTimeout.current = null;
    }

    isProgrammaticScroll.current = true;
    canAutoScroll.current = true;

    // Use double requestAnimationFrame to ensure browser has re-calculated the scroll container's layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior, block: 'end' });
      });
    });

    // Set a timeout to reset the programmatic scroll flag
    programmaticScrollTimeout.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 1000);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    const container = containerRef.current;
    const end = endRef.current;

    if (!container || !end) return;

    // Add scroll event listener to detect when user scrolls
    const handleScroll = () => {
      if (!scrollContainer) return;

      // Get current scroll position
      const currentScrollTop = scrollContainer.scrollTop;

      // Determine scroll direction
      const scrollDirection = currentScrollTop > prevScrollTop.current ? 'down' : 'up';

      // Store current position for next comparison
      prevScrollTop.current = currentScrollTop;

      // Check if scrolled to bottom (with small threshold for rounding errors)
      const isAtBottom = scrollContainer.scrollHeight - currentScrollTop - scrollContainer.clientHeight < graceAmount;

      if (isMouseWheelScroll.current) return;

      // Update canScroll based on scroll position
      canAutoScroll.current = isProgrammaticScroll.current || (scrollDirection === 'down' && isAtBottom);

      // console.log('useScrollToBottom.handleScroll()', {
      //   scrollDirection,
      //   isAtBottom,
      //   canScroll: canAutoScroll.current,
      //   isMouseWheelScroll: isMouseWheelScroll.current,
      // });
    };

    // Handle wheel events to detect mouse scrolling specifically
    const handleWheel = (e: WheelEvent) => {
      const direction = e.deltaY > 0 ? 'down' : 'up';

      isProgrammaticScroll.current = false;
      if (programmaticScrollTimeout.current) {
        clearTimeout(programmaticScrollTimeout.current);
        programmaticScrollTimeout.current = null;
      }

      if (mouseWheelScrollTimeout.current) {
        clearTimeout(mouseWheelScrollTimeout.current);
        mouseWheelScrollTimeout.current = null;
      }

      isMouseWheelScroll.current = true;

      // If user is scrolling up with mouse wheel, immediately disable auto-scrolling
      if (direction === 'up') {
        canAutoScroll.current = false;
      }

      setTimeout(() => {
        isMouseWheelScroll.current = false;
      }, 100);
    };

    if (scrollContainer) {
      prevScrollTop.current = scrollContainer.scrollTop;
      scrollContainer.addEventListener('scroll', handleScroll);
      scrollContainer.addEventListener('wheel', handleWheel, { passive: true });
    }

    const observer = new ResizeObserver(() => {
      resizeCount.current += 1;

      // Check if this is one of the initial resize events (first few layout calculations)
      if (!hasScrolledInitially.current && resizeCount.current >= 2) {
        scrollToBottom({ behavior: 'instant' });
        hasScrolledInitially.current = true;
      }
      // For subsequent resizes, use the normal scrolling logic with smooth behavior
      else if (hasScrolledInitially.current && canAutoScroll.current) {
        scrollToBottom({ behavior: 'smooth' });
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      scrollContainer?.removeEventListener('scroll', handleScroll);
      scrollContainer?.removeEventListener('wheel', handleWheel);
    };
  }, [scrollContainerRef, graceAmount, scrollToBottom]);

  useEffect(() => {
    hasScrolledInitially.current = false;
    resizeCount.current = 0;
    canAutoScroll.current = true;

    scrollToBottom();
  }, [props.resetKey, scrollToBottom]);

  return { containerRef, endRef, scrollToBottom };
}
