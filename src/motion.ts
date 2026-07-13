import { flushSync } from "react-dom";

export function motionIsReduced(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Progressively enhance state and route changes with the browser View
 * Transition API. The state update remains synchronous so React has painted
 * the destination before the transition captures its new frame.
 */
export function runArchiveTransition(update: () => void): void {
  if (typeof document.startViewTransition !== "function" || motionIsReduced()) {
    update();
    return;
  }

  document.startViewTransition(() => {
    flushSync(update);
  });
}
