"use client";

import { ArrowDown, ArrowUpRight, CalendarDays, Phone } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import type { Accommodation, SiteSettings } from "@/types/content";

type HeroProps = {
  settings: SiteSettings;
  accommodation: Accommodation;
};

export function Hero({ settings, accommodation }: HeroProps) {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let animationFrame = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updateProgress = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const hero = heroRef.current;
        if (!hero) return;

        const travel = Math.max(hero.offsetHeight - window.innerHeight, 1);
        const rawProgress = (window.scrollY - hero.offsetTop) / travel;
        const progress = reducedMotion.matches
          ? 0
          : Math.min(1, Math.max(0, rawProgress));
        const windowProgress = Math.min(1, progress / 0.92);
        const contentProgress = Math.min(1, progress / 0.72);
        const contentOpacity =
          progress < 0.38
            ? 1 - (progress / 0.38) * 0.08
            : Math.max(0, 0.92 * (1 - (progress - 0.38) / 0.34));
        const badgeOpacity =
          progress < 0.28
            ? 1 - (progress / 0.28) * 0.2
            : Math.max(0, 0.8 * (1 - (progress - 0.28) / 0.28));

        hero.style.setProperty(
          "--hero-window-scale",
          (1 - windowProgress * 0.14).toString(),
        );
        hero.style.setProperty(
          "--hero-window-y",
          `${windowProgress * 28}px`,
        );
        hero.style.setProperty(
          "--hero-window-radius",
          `${windowProgress * 76}px`,
        );
        hero.style.setProperty("--hero-image-y", `${progress * -34}px`);
        hero.style.setProperty(
          "--hero-content-y",
          `${contentProgress * -58}px`,
        );
        hero.style.setProperty(
          "--hero-content-opacity",
          contentOpacity.toString(),
        );
        hero.style.setProperty(
          "--hero-scroll-opacity",
          Math.max(0, 1 - progress / 0.2).toString(),
        );
        hero.style.setProperty(
          "--hero-badge-opacity",
          badgeOpacity.toString(),
        );
        hero.style.setProperty(
          "--hero-underlay-opacity",
          Math.min(1, Math.max(0, (progress - 0.36) / 0.36)).toString(),
        );
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    reducedMotion.addEventListener("change", updateProgress);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      reducedMotion.removeEventListener("change", updateProgress);
    };
  }, []);

  return (
    <section id="nahoru" ref={heroRef} className="hero">
      <div className="hero__sticky">
        <div className="hero__underlay page-shell" aria-hidden="true">
          <span>Velký dům · klidné místo</span>
          <strong>Janov</strong>
          <span>50° 51′ N · 14° 16′ E</span>
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
