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

import type { GalleryCategory, MediaImage } from "@/types/content";

type GalleryProps = {
  images: MediaImage[];
};

type Category = "vse" | GalleryCategory;

const categories: Array<{ id: Category; label: string }> = [
  { id: "vse", label: "Vše" },
  { id: "exterier", label: "Exteriér" },
  { id: "zahrada", label: "Zahrada & wellness" },
  { id: "spolecne", label: "Společné prostory" },
  { id: "pokoje", label: "Pokoje" },
];

export function Gallery({ images }: GalleryProps) {
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
  const visibleImages = expanded ? filteredImages : filteredImages.slice(0, 10);
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
      <div className="gallery-toolbar" aria-label="Filtr galerie">
        <div className="gallery-toolbar__label">
          <Images aria-hidden="true" size={18} />
          Vyberte si pohled
        </div>
        <div className="gallery-filters">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setExpanded(false);
              }}
            >
              {item.label}
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
            aria-label={`Otevřít fotografii: ${item.caption || item.alt}`}
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

      {filteredImages.length > 10 ? (
        <div className="gallery-more">
          <button
            type="button"
            className="button button--outline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Zobrazit méně" : `Zobrazit všech ${filteredImages.length} fotek`}
          </button>
        </div>
      ) : null}

      {activeImage ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Prohlížeč fotografií"
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
            aria-label="Zavřít galerii"
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
              aria-label="Zavřít galerii"
              onClick={close}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--left"
            aria-label="Předchozí fotografie"
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
              <span>Tažením nebo šipkami přejdete na další fotografii.</span>
            </figcaption>
          </figure>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--right"
            aria-label="Další fotografie"
            onClick={showNext}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
