"use client";

import { Menu, Phone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import type { SiteCopy } from "@/types/content";

type HeaderProps = {
  phone: string;
  locale: Locale;
  copy: SiteCopy;
  dictionary: Dictionary;
};

export function Header({ phone, locale, copy, dictionary }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigation = useMemo(
    () => [
      { href: "#o-domecku", label: copy.nav.about },
      { href: "#vybaveni", label: copy.nav.amenities },
      { href: "#galerie", label: copy.nav.gallery },
      { href: "#3d-prohlidka", label: copy.nav.tour },
      { href: "#cenik", label: copy.nav.pricing },
      { href: "#kontakt", label: copy.nav.contact },
    ],
    [copy.nav],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <header
      className={`site-header ${scrolled || open ? "site-header--scrolled" : ""}`}
    >
      <div className="site-header__inner">
        <a href="#nahoru" aria-label={dictionary.backToTop}>
          <Brand light={!scrolled && !open} />
        </a>

        <nav
          aria-label={dictionary.mainNavigation}
          className="site-header__desktop-nav"
        >
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <LanguageSwitcher locale={locale} labels={dictionary.language} />

          <a className="header-call" href={`tel:${phone}`}>
            <Phone aria-hidden="true" size={17} />
            {copy.actions.call}
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={open ? dictionary.closeMenu : dictionary.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className={`mobile-menu ${open ? "mobile-menu--open" : ""}`}
        aria-hidden={!open}
      >
        <nav aria-label={dictionary.mobileNavigation}>
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          className="button button--primary"
          href={`tel:${phone}`}
          tabIndex={open ? 0 : -1}
        >
          <Phone aria-hidden="true" size={18} />
          {copy.actions.callOwner}
        </a>
      </div>
    </header>
  );
}
