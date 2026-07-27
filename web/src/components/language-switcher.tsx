"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";
import { localeHref, localeList, localeMeta } from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  labels: {
    label: string;
    heading: string;
    current: string;
  };
};

/**
 * Compact language menu. The panel unfolds with a spring-ish scale while the
 * options stagger in one after another - each option carries its own `--index`
 * so the delay lives entirely in CSS and survives `prefers-reduced-motion`.
 */
export function LanguageSwitcher({ locale, labels }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const panelId = useId();
  const active = localeMeta[locale];

  // Keeps the reader on the same section when they switch language. Read after
  // hydration so the server-rendered href stays stable.
  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      event.preventDefault();
      const options = optionsRef.current.filter(
        (option): option is HTMLAnchorElement => option !== null,
      );
      if (options.length === 0) return;

      const current = options.indexOf(
        document.activeElement as HTMLAnchorElement,
      );
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next =
        current === -1
          ? 0
          : (current + step + options.length) % options.length;
      options[next]?.focus();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  return (
    <div
      ref={containerRef}
      className={`lang-switcher ${open ? "lang-switcher--open" : ""}`}
    >
      <button
        ref={buttonRef}
        type="button"
        className="lang-switcher__trigger"
        aria-label={`${labels.label} (${active.nativeName})`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages aria-hidden="true" size={16} />
        <span className="lang-switcher__code">{active.short}</span>
        <ChevronDown
          aria-hidden="true"
          size={15}
          className="lang-switcher__chevron"
        />
      </button>

      <div
        id={panelId}
        className="lang-switcher__panel"
        role="menu"
        aria-label={labels.heading}
        aria-hidden={!open}
      >
        <p className="lang-switcher__heading">{labels.heading}</p>
        {localeList.map((item, index) => {
          const isActive = item.code === locale;
          return (
            <Link
              key={item.code}
              ref={(node) => {
                optionsRef.current[index] = node;
              }}
              href={`${localeHref(item.code)}${hash}`}
              hrefLang={item.htmlLang}
              lang={item.htmlLang}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              aria-current={isActive ? "true" : undefined}
              className={`lang-switcher__option ${
                isActive ? "lang-switcher__option--active" : ""
              }`}
              style={{ "--index": index } as React.CSSProperties}
              onClick={() => close()}
            >
              <span className="lang-switcher__flag" aria-hidden="true">
                {item.flag}
              </span>
              <span className="lang-switcher__name">{item.nativeName}</span>
              <span className="lang-switcher__short" aria-hidden="true">
                {item.short}
              </span>
              {isActive ? (
                <>
                  <Check aria-hidden="true" size={15} />
                  <span className="visually-hidden">({labels.current})</span>
                </>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
