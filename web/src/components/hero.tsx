"use client";

import { ArrowDown, ArrowUpRight, CalendarDays, Phone } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import type { Accommodation, SiteSettings } from "@/types/content";

type HeroProps = {
  settings: SiteSettings;
  accommodation: Accommodation;
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

export function Hero({ settings, accommodation }: HeroProps) {
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
        "--hero-badge-opacity": fadeOut(progress, TIMING.badgeFade).toString(),
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
            <span>V Českém Švýcarsku</span>
            <span>50° 51′ N · 14° 16′ E</span>
          </div>
          <strong className="hero__underlay-word">Domeček Janov</strong>
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
                Zavolat
              </a>
              <a className="button button--glass" href="#cenik">
                <CalendarDays aria-hidden="true" size={18} />
                Termíny a ceny
              </a>
            </div>
          </div>
        </div>

        <a className="hero__scroll" href="#rychla-fakta">
          <span>Prohlédnout dům</span>
          <ArrowDown aria-hidden="true" />
        </a>

        <div className="hero__badge">
          <span>Až</span>
          <strong>{accommodation.capacity}</strong>
          <span>hostů</span>
          <ArrowUpRight aria-hidden="true" size={16} />
        </div>
      </div>
    </section>
  );
}
