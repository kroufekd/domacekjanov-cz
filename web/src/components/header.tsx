"use client";

import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Brand } from "@/components/brand";

type HeaderProps = {
  phone: string;
};

const navigation = [
  { href: "#o-domecku", label: "O domečku" },
  { href: "#vybaveni", label: "Vybavení" },
  { href: "#galerie", label: "Galerie" },
  { href: "#3d-prohlidka", label: "3D prohlídka" },
  { href: "#cenik", label: "Ceník" },
  { href: "#kontakt", label: "Kontakt" },
];

export function Header({ phone }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  return (
    <header
      className={`site-header ${scrolled || open ? "site-header--scrolled" : ""}`}
    >
      <div className="site-header__inner">
        <a href="#nahoru" aria-label="Domeček Janov – zpět nahoru">
          <Brand light={!scrolled && !open} />
        </a>

        <nav aria-label="Hlavní navigace" className="site-header__desktop-nav">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-call" href={`tel:${phone}`}>
          <Phone aria-hidden="true" size={17} />
          Zavolat
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div className={`mobile-menu ${open ? "mobile-menu--open" : ""}`}>
        <nav aria-label="Mobilní navigace">
          {navigation.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="button button--primary" href={`tel:${phone}`}>
          <Phone aria-hidden="true" size={18} />
          Zavolat majiteli
        </a>
      </div>
    </header>
  );
}
