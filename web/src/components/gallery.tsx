"use client";

import { Expand, Images } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

import { cycleIndex, ImageLightbox } from "@/components/image-lightbox";
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

const categoryOrder: Category[] = ["vse", "exterier", "spolecne", "pokoje"];

const VISIBLE_BY_DEFAULT = 10;

export function Gallery({ images, copy, actions, dictionary }: GalleryProps) {
  const [category, setCategory] = useState<Category>("vse");
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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
    setOpenIndex((current) =>
      current === null ? null : cycleIndex(current, -1, filteredImages.length),
    );
  }, [filteredImages.length]);

  const showNext = useCallback(() => {
    setOpenIndex((current) =>
      current === null ? null : cycleIndex(current, 1, filteredImages.length),
    );
  }, [filteredImages.length]);

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
            <span
              className={`gallery-card__overlay ${
                item.caption ? "" : "gallery-card__overlay--bare"
              }`}
            >
              {item.caption ? <span>{item.caption}</span> : null}
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
        <ImageLightbox
          label={dictionary.viewer}
          closeLabel={dictionary.close}
          top={`${openIndex! + 1} / ${filteredImages.length}`}
          navigation={{
            previousLabel: dictionary.previous,
            nextLabel: dictionary.next,
          }}
          onClose={close}
          onPrevious={showPrevious}
          onNext={showNext}
        >
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
        </ImageLightbox>
      ) : null}
    </>
  );
}
