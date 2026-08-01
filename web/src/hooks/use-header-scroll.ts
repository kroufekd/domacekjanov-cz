"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Below this the header still floats over the hero, so it keeps the light variant. */
const SOLID_OFFSET = 24;
/** Right under the hero a retracting header reads as a glitch - give it room first. */
const HIDE_AFTER = 220;
/** Swallows trackpad jitter and rubber-band bounce. */
const DIRECTION_THRESHOLD = 6;
/** No scroll event for this long means the smooth anchor jump has landed. */
const SETTLE_MS = 250;

export type HeaderScrollState = {
  /** Past the hero: solid background, dark type. */
  solid: boolean;
  /** Scrolling down: slide the bar out of the way. */
  hidden: boolean;
};

const INITIAL_STATE: HeaderScrollState = { solid: false, hidden: false };

type UseHeaderScrollOptions = {
  /** While the mobile menu is open the header has to stay on screen. */
  locked: boolean;
};

export type UseHeaderScrollResult = HeaderScrollState & {
  /** Pins the header visible until scrolling settles - call it on anchor clicks. */
  hold: () => void;
};

export function useHeaderScroll({
  locked,
}: UseHeaderScrollOptions): UseHeaderScrollResult {
  const [state, setState] = useState<HeaderScrollState>(INITIAL_STATE);
  const lastY = useRef(0);
  const holding = useRef(false);
  const holdDeadline = useRef(0);
  const frame = useRef<number | null>(null);

  /** Suspends the hide rule until the page stops moving. */
  const pin = useCallback(() => {
    holding.current = true;
    holdDeadline.current = performance.now() + SETTLE_MS;
  }, []);

  /**
   * An anchor jump scrolls down on purpose, so "down means hide" would yank the
   * bar away mid-flight. Bring it back and keep it there for the whole trip.
   */
  const hold = useCallback(() => {
    pin();
    setState((current) =>
      current.hidden ? { ...current, hidden: false } : current,
    );
  }, [pin]);

  useEffect(() => {
    // Landing on /#cenik scrolls smoothly on its own, one small step at a time -
    // indistinguishable from a gesture unless we pin the bar for the trip.
    if (window.location.hash) pin();

    window.addEventListener("hashchange", hold);
    return () => window.removeEventListener("hashchange", hold);
  }, [hold, pin]);

  useEffect(() => {
    const read = () => {
      frame.current = null;

      const now = performance.now();
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY.current;
      const solid = y > SOLID_OFFSET;
      // Anything smaller is jitter, not a change of intent.
      const moved = Math.abs(delta) >= DIRECTION_THRESHOLD;

      // No gesture covers a whole screen in one frame - that is a scripted jump
      // (landing on /#cenik, "back to top"), and it must not retract the bar.
      const jumped = Math.abs(delta) > window.innerHeight;

      if (moved) lastY.current = y;

      // Still receiving events? The jump is in flight - push the deadline out.
      if (holding.current) {
        if (now > holdDeadline.current) holding.current = false;
        else holdDeadline.current = now + SETTLE_MS;
      }

      const pinned = locked || holding.current || jumped;

      setState((current) => {
        const hidden =
          !pinned &&
          (moved ? delta > 0 && y > HIDE_AFTER : current.hidden);

        return current.solid === solid && current.hidden === hidden
          ? current
          : { solid, hidden };
      });
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(read);
    };

    /** Taking the wheel back cancels the anchor pin immediately. */
    const releaseHold = () => {
      holding.current = false;
    };

    lastY.current = Math.max(window.scrollY, 0);
    // Deferred to the next frame so the first read lands outside the effect body.
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", releaseHold, { passive: true });
    window.addEventListener("touchmove", releaseHold, { passive: true });
    window.addEventListener("keydown", releaseHold);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", releaseHold);
      window.removeEventListener("touchmove", releaseHold);
      window.removeEventListener("keydown", releaseHold);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [locked]);

  return { ...state, hold };
}
