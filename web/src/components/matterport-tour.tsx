"use client";

import { ArrowUpRight, Box, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { localAsset } from "@/lib/paths";

type MatterportTourProps = {
  url: string;
};

export function MatterportTour({ url }: MatterportTourProps) {
  const [started, setStarted] = useState(false);
  const embedUrl = `${url}${url.includes("?") ? "&" : "?"}play=1&qs=1`;

  return (
    <div className={started ? "tour-frame tour-frame--live" : "tour-frame"}>
      {started ? (
        <>
          <iframe
            src={embedUrl}
            title="3D prohlídka Domečku Janov"
            allow="fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
          <a
            className="tour-frame__fallback"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Problém s prohlídkou? Otevřít samostatně
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </>
      ) : (
        <>
          <Image
            src={localAsset("/images/kitchen-dining.jpg")}
            alt="Společenská místnost Domečku Janov"
            fill
            sizes="(max-width: 900px) 100vw, 1200px"
          />
          <div className="tour-frame__overlay">
            <div className="tour-frame__meta">
              <Box aria-hidden="true" />
              <span>Projděte se domem ještě před příjezdem</span>
            </div>
            <button
              className="tour-frame__play"
              type="button"
              onClick={() => setStarted(true)}
            >
              <span>
                <Play aria-hidden="true" fill="currentColor" />
              </span>
              Spustit 3D prohlídku
            </button>
            <a href={url} target="_blank" rel="noreferrer">
              Otevřít samostatně
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
