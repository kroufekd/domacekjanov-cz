"use client";

import { Award, Expand } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { cycleIndex, ImageLightbox } from "@/components/image-lightbox";
import type { Dictionary } from "@/i18n/dictionary";
import { formatTemplate } from "@/lib/format";
import { localAsset } from "@/lib/paths";
import type { SiteCopy } from "@/types/content";

type Certificate = {
  id: string;
  year: string;
  score: string;
  src: string;
};

/**
 * Newest first. The plate always shows the first entry; older years stay in the
 * viewer, so the hero keeps one trust mark instead of a wall of certificates.
 * The score is part of the artwork, so it lives here rather than in the
 * translations - only the wording around it is editable.
 *
 * The plate and footer card spell the year out in the text (`ocenění 2025`)
 * rather than through a placeholder, so the owner never meets `{year}` in the
 * editing panel. Adding a newer certificate therefore means editing those two
 * texts as well - the viewer below still fills the year in on its own, because
 * it browses older years too.
 */
const certificates: Certificate[] = [
  {
    id: "2025",
    year: "2025",
    score: "9,5",
    src: localAsset("/images/booking-award-2025.jpg"),
  },
  {
    id: "2024",
    year: "2024",
    score: "9,6",
    src: localAsset("/images/booking-award-2024.jpg"),
  },
];

const [latest] = certificates;
const navigable = certificates.length > 1;

type BookingAwardProps = {
  /**
   * "hero" is the square plate stacked on the capacity badge. Below 1240px the
   * hero action row reaches into that corner, so the layout falls back to the
   * "footer" card - CSS swaps which one is displayed.
   */
  variant: "hero" | "footer";
  copy: SiteCopy["award"];
  dictionary: Dictionary["award"];
};

export function BookingAward({ variant, copy, dictionary }: BookingAwardProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const active = openIndex === null ? null : certificates[openIndex];

  const close = useCallback(() => {
    setOpenIndex(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const showPrevious = useCallback(() => {
    setOpenIndex((current) =>
      current === null ? null : cycleIndex(current, -1, certificates.length),
    );
  }, []);

  const showNext = useCallback(() => {
    setOpenIndex((current) =>
      current === null ? null : cycleIndex(current, 1, certificates.length),
    );
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={variant === "hero" ? "hero-award" : "award-badge"}
        onClick={() => setOpenIndex(0)}
        aria-label={formatTemplate(dictionary.open, { year: latest.year })}
      >
        {variant === "hero" ? (
          <>
            <Expand className="hero-award__expand" aria-hidden="true" size={16} />
            <span>{copy.source}</span>
            <strong>{latest.score}</strong>
            <span>{formatTemplate(copy.plateLabel, { year: latest.year })}</span>
          </>
        ) : (
          <>
            <span className="award-badge__score">
              <strong>{latest.score}</strong>
              <small>{copy.scoreSuffix}</small>
            </span>
            <span className="award-badge__text">
              <span className="award-badge__title">
                <Award aria-hidden="true" size={13} />
                {formatTemplate(copy.cardTitle, { year: latest.year })}
              </span>
              <span className="award-badge__source">{copy.cardSource}</span>
            </span>
            <Expand className="award-badge__expand" aria-hidden="true" size={15} />
          </>
        )}
      </button>

      {active ? (
        <ImageLightbox
          label={dictionary.viewer}
          closeLabel={dictionary.close}
          top={formatTemplate(copy.viewerTop, { year: active.year })}
          navigation={
            navigable
              ? {
                  previousLabel: dictionary.previous,
                  nextLabel: dictionary.next,
                }
              : undefined
          }
          onClose={close}
          onPrevious={showPrevious}
          onNext={showNext}
        >
          <figure className="lightbox__figure">
            <div className="lightbox__image lightbox__image--award">
              <Image
                src={active.src}
                alt={formatTemplate(dictionary.certificateAlt, {
                  year: active.year,
                  score: active.score,
                })}
                fill
                priority
                sizes="(max-width: 640px) 92vw, 720px"
              />
            </div>
            <figcaption>
              <strong>
                {formatTemplate(copy.viewerCaption, {
                  year: active.year,
                  score: active.score,
                })}
              </strong>
              {navigable ? <span>{copy.viewerHint}</span> : null}
            </figcaption>
          </figure>
        </ImageLightbox>
      ) : null}
    </>
  );
}
