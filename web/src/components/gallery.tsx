"use client";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Images,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Dictionary } from "@/i18n/dictionary";
import { formatTemplate } from "@/lib/format";
import type { GalleryCategory, MediaImage, SiteCopy } from "@/types/content";

type GalleryProps = {
  images: MediaImage[];
  copy: SiteCopy["gallery"];
  actions: Pick<SiteCopy["actions"], "showAll" | "showLess">;
  dictionary: Dictionary["gallery"];
};

type Category = "vse" | GalleryCategory;

const categoryOrder: Category[] = [
  "vse",
  "exterier",
  "zahrada",
  "spolecne",
  "pokoje",
];

const VISIBLE_BY_DEFAULT = 10;

export function Gallery({ images, copy, actions, dictionary }: GalleryProps) {
  const [category, setCategory] = useState<Category>("vse");
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const filteredImages = useMemo(
    () =>
      category === "vse"
        ? images
        : images.filter((item) => item.category === category),
    [category, images],
  );
  const visibleImages = expanded
    ? filteredImages
    : filteredImages.slice(0, VISIBLE_BY_DEFAULT);
  const activeImage = openIndex === null ? null : filteredImages[openIndex];

  const close = useCallback(() => {
    setOpenIndex(null);
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  }, []);

  const showPrevious = useCallback(() => {
    setOpenIndex((current) => {
      if (current === null) return null;
      return (current - 1 + filteredImages.length) % filteredImages.length;
    });
  }, [filteredImages.length]);

  const showNext = useCallback(() => {
    setOpenIndex((current) => {
      if (current === null) return null;
      return (current + 1) % filteredImages.length;
    });
  }, [filteredImages.length]);

  useEffect(() => {
    if (openIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, openIndex, showNext, showPrevious]);

  return (
    <>
      <div className="gallery-toolbar" aria-label={dictionary.filterRegion}>
        <div className="gallery-toolbar__label">
          <Images aria-hidden="true" size={18} />
          {copy.filterLabel}
        </div>
        <div className="gallery-filters">
          {categoryOrder.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
                setExpanded(false);
              }}
            >
              {copy.categories[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="gallery-grid">
        {visibleImages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`gallery-card ${
              item.featured || index === 0 || index === 5
                ? "gallery-card--wide"
                : ""
            }`}
            onClick={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setOpenIndex(index);
            }}
            aria-label={`${dictionary.openPhoto}: ${item.caption || item.alt}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            />
            <span className="gallery-card__overlay">
              <span>{item.caption || item.alt}</span>
              <Expand aria-hidden="true" size={19} />
            </span>
          </button>
        ))}
      </div>

      {filteredImages.length > VISIBLE_BY_DEFAULT ? (
        <div className="gallery-more">
          <button
            type="button"
            className="button button--outline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? actions.showLess
              : formatTemplate(actions.showAll, {
                  count: filteredImages.length,
                })}
          </button>
        </div>
      ) : null}

      {activeImage ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={dictionary.viewer}
          onTouchStart={(event) => {
            touchStart.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const end = event.changedTouches[0]?.clientX;
            touchStart.current = null;
            if (start === null || end === undefined) return;
            const difference = end - start;
            if (difference > 55) showPrevious();
            if (difference < -55) showNext();
          }}
        >
          <button
            type="button"
            className="lightbox__backdrop"
            aria-label={dictionary.close}
            onClick={close}
          />
          <div className="lightbox__top">
            <span>
              {openIndex! + 1} / {filteredImages.length}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              className="icon-button icon-button--light"
              aria-label={dictionary.close}
              onClick={close}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--left"
            aria-label={dictionary.previous}
            onClick={showPrevious}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <figure className="lightbox__figure">
            <div className="lightbox__image">
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                priority
                sizes="100vw"
              />
            </div>
            <figcaption>
              <strong>{activeImage.caption || activeImage.alt}</strong>
              <span>{copy.swipeHint}</span>
            </figcaption>
          </figure>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--right"
            aria-label={dictionary.next}
            onClick={showNext}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
