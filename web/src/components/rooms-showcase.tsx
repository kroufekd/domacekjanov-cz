"use client";

import Image from "next/image";
import { useState } from "react";

import { localAsset } from "@/lib/paths";
import type { Accommodation, MediaImage } from "@/types/content";

/**
 * Photo that takes over the showcase while a room is hovered, in the same order
 * as the room list. Extra rooms added in Sanity simply keep the default photo.
 */
const roomImageIds = [
  "bedroom-bunk", // Pokoj s palandami
  "bedroom-twin", // Třílůžkový pokoj
  "bedroom-double-window", // Tři dvoulůžkové pokoje v patře
  "bedroom-double", // Přízemní dvoulůžkový pokoj
  "living-room", // Obývací pokoj
];

const defaultImageId = "bedroom-double";

type RoomsShowcaseProps = {
  rooms: Accommodation["rooms"];
  gallery: MediaImage[];
  fallbackAlt: string;
};

/**
 * The gallery is editable in Sanity, so an id can be missing there. The bundled
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

  return (
    <div className="rooms-showcase">
      <figure className="rooms-showcase__image">
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
      <div className="rooms-list" onMouseLeave={() => setActiveIndex(null)}>
        {rooms.map((room, index) => (
          <article
            key={room.title}
            className={activeIndex === index ? "is-active" : undefined}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <h3>{room.title}</h3>
            <p>{room.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
