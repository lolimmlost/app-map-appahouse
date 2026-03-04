import { useRef, useEffect, useCallback } from "react";

/**
 * Prevents accidental touch interactions while scrolling.
 * Tracks scroll state and provides a guard function that returns
 * true if the user was recently scrolling (within the cooldown period).
 *
 * Usage:
 *   const { isScrolling, guardedHandler } = useScrollGuard();
 *   <button onPointerDown={guardedHandler((e) => doSomething(e))} />
 */
export function useScrollGuard(cooldownMs = 150) {
  const scrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScrollStart = () => {
      scrollingRef.current = true;
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };

    const onScrollEnd = () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = setTimeout(() => {
        scrollingRef.current = false;
      }, cooldownMs);
    };

    // Use capture phase to detect scroll as early as possible
    window.addEventListener("scroll", onScrollStart, { capture: true, passive: true });
    window.addEventListener("scrollend", onScrollEnd, { capture: true, passive: true });
    // Also listen for touchmove as a secondary signal
    window.addEventListener("touchmove", onScrollStart, { capture: true, passive: true });
    window.addEventListener("touchend", onScrollEnd, { capture: true, passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollStart, { capture: true } as EventListenerOptions);
      window.removeEventListener("scrollend", onScrollEnd, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", onScrollStart, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchend", onScrollEnd, { capture: true } as EventListenerOptions);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [cooldownMs]);

  const isScrolling = useCallback(() => scrollingRef.current, []);

  /**
   * Wraps an event handler so it only fires when the user is NOT scrolling.
   */
  const guardedHandler = useCallback(
    <E extends React.SyntheticEvent>(handler: (e: E) => void) => {
      return (e: E) => {
        if (scrollingRef.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        handler(e);
      };
    },
    []
  );

  return { isScrolling, guardedHandler };
}
