"use client";

import Image from "next/image";
import { type MouseEvent, useState } from "react";

import { localAsset } from "@/lib/paths";
import type { Accommodation, MediaImage } from "@/types/content";

/**
 * Photo that takes over the showcase while a room is picked, in the same order
 * as the room list. Extra rooms added in the panel simply keep the default photo.
 */
const roomImageIds = [
  "bedroom-bunk", // Pokoj s palandami
  "bedroom-twin", // Třílůžkový pokoj
  "bedroom-double-window", // Tři dvoulůžkové pokoje v patře
  "bedroom-double", // Přízemní dvoulůžkový pokoj
  "living-room", // Obývací pokoj
];

const defaultImageId = "bedroom-double";

const imageId = "rooms-showcase-image";

type RoomsShowcaseProps = {
  rooms: Accommodation["rooms"];
  gallery: MediaImage[];
  fallbackAlt: string;
};

/**
 * The gallery is editable in the panel, so an id can be missing there. The bundled
 * photo of the same name is the safety net.
 */
function resolveImage(
  gallery: MediaImage[],
  id: string,
  fallbackAlt: string,
): MediaImage {
  const match = gallery.find((image) => image.id === id);
  if (match) return match;

  return {
    id,
    src: localAsset(`/images/${id}.jpg`),
    alt: fallbackAlt,
    width: 1600,
    height: 1200,
  };
}

export function RoomsShowcase({
  rooms,
  gallery,
  fallbackAlt,
}: RoomsShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeId =
    activeIndex === null
      ? defaultImageId
      : (roomImageIds[activeIndex] ?? defaultImageId);
  const slides = [...new Set([defaultImageId, ...roomImageIds])].map((id) =>
    resolveImage(gallery, id, fallbackAlt),
  );

  /**
   * Odjezd myší vrací výchozí fotku - ale ne v okamžiku, kdy si pokoj drží
   * klávesnice. Jinak by hostovi zmizela fotka pokoje, na kterém stojí.
   */
  const releaseOnLeave = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(document.activeElement)) return;
    setActiveIndex(null);
  };

  return (
    <div className="rooms-showcase">
      <figure className="rooms-showcase__image" id={imageId}>
        {slides.map((image) => {
          const isActive = image.id === activeId;
          return (
            <div
              key={image.id}
              className={`rooms-showcase__slide${isActive ? " is-active" : ""}`}
              aria-hidden={!isActive}
            >
              <Image
                src={image.src}
                alt={isActive ? image.alt : ""}
                fill
                sizes="(max-width: 900px) 94vw, 52vw"
              />
            </div>
          );
        })}
      </figure>
      <div className="rooms-list" onMouseLeave={releaseOnLeave}>
        {rooms.map((room, index) => (
          <article
            key={room.title}
            className={activeIndex === index ? "is-active" : undefined}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <h3>
              {/*
               * Hover sám by fotku schoval klávesnici i dotyku - na mobilu
               * `mouseenter` nepřijde vůbec. Nadpis proto ovládá tlačítko:
               * focus i klepnutí dělají to samé co najetí myší.
               */}
              <button
                type="button"
                aria-controls={imageId}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                {room.title}
              </button>
            </h3>
            <p>{room.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
