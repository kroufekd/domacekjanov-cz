"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Horizontal travel, in pixels, before a touch counts as a swipe. */
const SWIPE_THRESHOLD = 55;

/** Wrap an index around a list, so the viewers can loop in both directions. */
export function cycleIndex(current: number, delta: number, count: number) {
  return count < 1 ? 0 : (current + delta + count) % count;
}

type ImageLightboxProps = {
  /** Accessible name of the dialog. */
  label: string;
  closeLabel: string;
  /** Sits opposite the close button - a counter, a year, anything short. */
  top: ReactNode;
  /** Arrows are hidden when there is nothing to page through. */
  navigation?: { previousLabel: string; nextLabel: string };
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  children: ReactNode;
};

/**
 * Fullscreen image viewer shared by the gallery and the award badge. The caller
 * owns which item is open; this component only owns the shell - backdrop,
 * keyboard shortcuts, scroll lock and touch swipe. It is mounted only while
 * open, so the close button can take focus straight away.
 */
export function ImageLightbox({
  label,
  closeLabel,
  top,
  navigation,
  onClose,
  onPrevious,
  onNext,
  children,
}: ImageLightboxProps) {
  const touchStart = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious();
      if (event.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNext, onPrevious]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        touchStart.current = null;
        if (start === null || end === undefined) return;
        const difference = end - start;
        if (difference > SWIPE_THRESHOLD) onPrevious();
        if (difference < -SWIPE_THRESHOLD) onNext();
      }}
    >
      <button
        type="button"
        className="lightbox__backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="lightbox__top">
        <span>{top}</span>
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button icon-button--light"
          aria-label={closeLabel}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      </div>
      {navigation ? (
        <button
          type="button"
          className="lightbox__arrow lightbox__arrow--left"
          aria-label={navigation.previousLabel}
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      ) : null}
      {children}
      {navigation ? (
        <button
          type="button"
          className="lightbox__arrow lightbox__arrow--right"
          aria-label={navigation.nextLabel}
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
