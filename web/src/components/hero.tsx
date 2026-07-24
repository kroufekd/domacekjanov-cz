"use client";

import { ArrowDown, ArrowUpRight, CalendarDays, Phone } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { useRef } from "react";

import type { Accommodation, SiteSettings } from "@/types/content";

type HeroProps = {
  settings: SiteSettings;
  accommodation: Accommodation;
};

export function Hero({ settings, accommodation }: HeroProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 0.75], [0, 100]);
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.55, 0.9],
    [1, 0.86, 0],
  );
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <section id="nahoru" ref={heroRef} className="hero">
      <div className="hero__sticky">
        <div className="hero__image-window">
          <motion.div
            className="hero__image"
            style={{ scale: prefersReducedMotion ? 1 : imageScale }}
          >
            <Image
              src={settings.heroImage.src}
              alt={settings.heroImage.alt}
              fill
              priority
              quality={88}
              sizes="100vw"
            />
          </motion.div>
          <div className="hero__veil" />
        </div>

        <motion.div
          className="hero__content page-shell"
          style={{
            y: prefersReducedMotion ? 0 : contentY,
            opacity: prefersReducedMotion ? 1 : contentOpacity,
          }}
        >
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
        </motion.div>

        <motion.a
          className="hero__scroll"
          href="#rychla-fakta"
          style={{ opacity: prefersReducedMotion ? 1 : scrollOpacity }}
        >
          <span>Objevit domeček</span>
          <ArrowDown aria-hidden="true" />
        </motion.a>

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
