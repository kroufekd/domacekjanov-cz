"use client";

import { ArrowUpRight, Box, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { localAsset } from "@/lib/paths";
import type { SiteCopy } from "@/types/content";

type MatterportTourProps = {
  url: string;
  copy: SiteCopy["tour"];
  actions: Pick<
    SiteCopy["actions"],
    "startTour" | "openSeparately" | "tourIssue"
  >;
  iframeTitle: string;
  posterAlt: string;
};

export function MatterportTour({
  url,
  copy,
  actions,
  iframeTitle,
  posterAlt,
}: MatterportTourProps) {
  const [started, setStarted] = useState(false);
  const embedUrl = `${url}${url.includes("?") ? "&" : "?"}play=1&qs=1`;

  return (
    <div className={started ? "tour-frame tour-frame--live" : "tour-frame"}>
      {started ? (
        <>
          <iframe
            src={embedUrl}
            title={iframeTitle}
            allow="fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
          <a
            className="tour-frame__fallback"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {actions.tourIssue}
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </>
      ) : (
        <>
          <Image
            src={localAsset("/images/kitchen-dining.jpg")}
            alt={posterAlt}
            fill
            sizes="(max-width: 900px) 100vw, 1200px"
          />
          <div className="tour-frame__overlay">
            <div className="tour-frame__meta">
              <Box aria-hidden="true" />
              <span>{copy.teaser}</span>
            </div>
            <button
              className="tour-frame__play"
              type="button"
              onClick={() => setStarted(true)}
            >
              <span>
                <Play aria-hidden="true" fill="currentColor" />
              </span>
              {actions.startTour}
            </button>
            <a href={url} target="_blank" rel="noreferrer">
              {actions.openSeparately}
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
