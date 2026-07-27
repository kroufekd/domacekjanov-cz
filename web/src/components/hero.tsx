"use client";

import { ArrowDown, ArrowUpRight, CalendarDays, Phone } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { BookingAward } from "@/components/booking-award";
import type { Dictionary } from "@/i18n/dictionary";
import type { Accommodation, SiteCopy, SiteSettings } from "@/types/content";

type HeroProps = {
  settings: SiteSettings;
  accommodation: Accommodation;
  copy: SiteCopy;
  dictionary: Dictionary;
};

/**
 * Scroll choreography. Every number is a share of the hero travel (0-1).
 * The geometry itself (shrink, lift, radius, blur) lives in globals.css, so the
 * reveal bands around the photo can be derived from exactly the same values.
 */
const TIMING = {
  windowEnd: 0.92,
  contentEnd: 0.72,
  veilEnd: 0.6,
  scrollHintEnd: 0.2,
  contentFade: { start: 0.34, end: 0.68, initialDrop: 0.08 },
  badgeFade: { start: 0.26, end: 0.54, initialDrop: 0.2 },
  underlay: { start: 0.4, end: 0.84 },
} as const;

const PARALLAX = {
  image: -34,
  content: -58,
} as const;

type HeroGeometry = {
  shrink: number;
  lift: number;
  radius: number;
  blur: number;
  veilFloor: number;
};

const GEOMETRY_FALLBACK: HeroGeometry = {
  shrink: 0.2,
  lift: 40,
  radius: 64,
  blur: 4,
  veilFloor: 0.1,
};

type FadeRange = { start: number; end: number; initialDrop: number };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Slight dim while the layer is still in place, then a full fade-out. */
const fadeOut = (progress: number, { start, end, initialDrop }: FadeRange) =>
  progress < start
    ? 1 - (progress / start) * initialDrop
    : Math.max(0, (1 - initialDrop) * (1 - (progress - start) / (end - start)));

const readGeometry = (element: HTMLElement): HeroGeometry => {
  const styles = window.getComputedStyle(element);
  const read = (name: string, fallback: number) => {
    const parsed = Number.parseFloat(styles.getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    shrink: read("--hero-shrink", GEOMETRY_FALLBACK.shrink),
    lift: read("--hero-lift", GEOMETRY_FALLBACK.lift),
    radius: read("--hero-radius", GEOMETRY_FALLBACK.radius),
    blur: read("--hero-blur", GEOMETRY_FALLBACK.blur),
    veilFloor: read("--hero-veil-floor", GEOMETRY_FALLBACK.veilFloor),
  };
};

export function Hero({ settings, accommodation, copy, dictionary }: HeroProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const sticky = stickyRef.current;
    if (!hero || !sticky) return;

    let animationFrame = 0;
    let geometry = readGeometry(hero);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = (variables: Record<string, string>) => {
      for (const [name, value] of Object.entries(variables)) {
        hero.style.setProperty(name, value);
      }
    };

    const render = () => {
      const travel = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = reducedMotion.matches
        ? 0
        : clamp01((window.scrollY - hero.offsetTop) / travel);

      const windowProgress = Math.min(1, progress / TIMING.windowEnd);
      const contentProgress = Math.min(1, progress / TIMING.contentEnd);
      const veilProgress = Math.min(1, progress / TIMING.veilEnd);
      const underlayProgress = clamp01(
        (progress - TIMING.underlay.start) /
          (TIMING.underlay.end - TIMING.underlay.start),
      );
      const blur = reducedMotion.matches
        ? 0
        : geometry.blur * (1 - veilProgress);
      const badgeOpacity = fadeOut(progress, TIMING.badgeFade);

      apply({
        "--hero-window-scale": (1 - windowProgress * geometry.shrink).toString(),
        "--hero-window-y": `${windowProgress * -geometry.lift}px`,
        "--hero-window-radius": `${windowProgress * geometry.radius}px`,
        "--hero-image-y": `${progress * PARALLAX.image}px`,
        "--hero-image-blur": `${blur}px`,
        "--hero-veil-opacity": (
          1 -
          veilProgress * (1 - geometry.veilFloor)
        ).toString(),
        "--hero-content-y": `${contentProgress * PARALLAX.content}px`,
        "--hero-content-opacity": fadeOut(
          progress,
          TIMING.contentFade,
        ).toString(),
        "--hero-badge-opacity": badgeOpacity.toString(),
        // The award plate is a button, so a faded badge has to stop taking clicks.
        "--hero-badge-events": badgeOpacity < 0.05 ? "none" : "auto",
        "--hero-scroll-opacity": clamp01(
          1 - progress / TIMING.scrollHintEnd,
        ).toString(),
        "--hero-underlay-opacity": underlayProgress.toString(),
      });
    };

    const schedule = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(render);
    };

    // Breakpoints can change the geometry, so re-read it whenever layout shifts.
    const measure = () => {
      geometry = readGeometry(hero);
      hero.style.setProperty("--hero-sticky-height", `${sticky.offsetHeight}px`);
      schedule();
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    reducedMotion.addEventListener("change", measure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      reducedMotion.removeEventListener("change", measure);
    };
  }, []);

  return (
    <section id="nahoru" ref={heroRef} className="hero">
      <div className="hero__sticky paper-texture" ref={stickyRef}>
        <div className="hero__underlay" aria-hidden="true">
          <div className="hero__underlay-meta">
            <span>{copy.hero.metaPlace}</span>
            <span>{copy.hero.metaCoords}</span>
          </div>
          <strong className="hero__underlay-word">{settings.title}</strong>
        </div>

        <div className="hero__image-window">
          <div className="hero__image">
            <Image
              src={settings.heroImage.src}
              alt={settings.heroImage.alt}
              fill
              priority
              quality={88}
              sizes="100vw"
            />
          </div>
          <div className="hero__veil" />
        </div>

        <div className="hero__content page-shell">
          <p className="hero__eyebrow">{settings.heroEyebrow}</p>
          <h1>{settings.heroTitle}</h1>
          <div className="hero__bottom">
            <p>{settings.heroDescription}</p>
            <div className="hero__actions">
              <a className="button button--light" href={`tel:${settings.phone}`}>
                <Phone aria-hidden="true" size={18} />
                {copy.actions.call}
              </a>
              <a className="button button--glass" href="#cenik">
                <CalendarDays aria-hidden="true" size={18} />
                {copy.actions.datesAndPrices}
              </a>
            </div>
          </div>
        </div>

        <a className="hero__scroll" href="#rychla-fakta">
          <span>{copy.actions.exploreHouse}</span>
          <ArrowDown aria-hidden="true" />
        </a>

        <BookingAward
          variant="hero"
          copy={copy.award}
          dictionary={dictionary.award}
        />

        <div className="hero__badge">
          <span>{copy.hero.badgePrefix}</span>
          <strong>{accommodation.capacity}</strong>
          <span>{copy.hero.badgeSuffix}</span>
          <ArrowUpRight aria-hidden="true" size={16} />
        </div>
      </div>
    </section>
  );
}
