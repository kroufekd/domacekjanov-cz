"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { localeFromPathname, type Locale } from "@/i18n/config";

import { EditPanel } from "./edit-panel";
import { createFrameBridge, type FrameBridge } from "./frame-bridge";
import styles from "./edit-mode.module.css";

/**
 * Dílna: web v rámu vlevo, panel s texty vpravo.
 *
 * Rám je tu proto, že web dostane vlastní viewport. Panel položený přes
 * stránku by ji nejen zakrýval - hero, lepivá hlavička a šířky počítané z
 * `100vw` by pořád počítaly s celou obrazovkou a rozjely by se. Takhle web
 * neví, že vedle něj něco stojí, a vypadá přesně jako naostro.
 *
 * Rám je ze stejné domény, takže se do něj sahá přímo. Spojení obstarává
 * `createFrameBridge`.
 */

const PANEL_ATTRIBUTE = "data-domecek-edit";

/** Jak často se kouká na adresu rámu. Krátce, ať přepnutí jazyka neblikne. */
const PATH_POLL_MS = 250;

type EditWorkbenchProps = {
  /** Jazyk stránky, se kterou se dílna otevřela; dál ho určuje rám. */
  readonly initialLocale: Locale;
  /** Adresa, kterou má rám ukázat - bez `?edit`, jinak by se zacyklil. */
  readonly previewPath: string;
  readonly onExit: () => void;
  readonly onSignedOut: () => void;
};

/** Adresa, na které rám právě stojí. `null`, když do něj není vidět. */
function framePathname(frame: HTMLIFrameElement | null): string | null {
  try {
    return frame?.contentWindow?.location.pathname ?? null;
  } catch {
    return null;
  }
}

export function EditWorkbench({
  initialLocale,
  previewPath,
  onExit,
  onSignedOut,
}: EditWorkbenchProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scrollToRestore = useRef<number | null>(null);
  /** Naposledy viděná adresa rámu; podle ní se pozná přechod na jinou stránku. */
  const seenPath = useRef<string | null>(null);
  const [bridge, setBridge] = useState<FrameBridge | null>(null);
  const [frameEpoch, setFrameEpoch] = useState(0);
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // Spojení vzniká až po prvním vykreslení, protože sahá na rám. Panel proto
  // naskočí o jedno vykreslení později, což není vidět - rám se stejně načítá.
  useEffect(() => {
    const created = createFrameBridge({
      getDocument: () => frame.current?.contentDocument ?? null,
    });

    setBridge(created);
    return () => created.dispose();
  }, []);

  // Stránka pod dílnou se nesmí posouvat, jinak kolečko nad panelem scrolluje
  // něco, co není vidět.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /** Po uložení se rám načte znovu, ať je vidět, co doopravdy leží v CMS. */
  const reloadPreview = useCallback(() => {
    const view = frame.current?.contentWindow;
    if (!view) return;

    scrollToRestore.current = view.scrollY;
    view.location.reload();
  }, []);

  const handleFrameLoad = useCallback(() => {
    const view = frame.current?.contentWindow;
    const offset = scrollToRestore.current;
    if (view && offset !== null) {
      view.scrollTo(0, offset);
      scrollToRestore.current = null;
    }

    seenPath.current = framePathname(frame.current);
    if (seenPath.current) setLocale(localeFromPathname(seenPath.current));

    setFrameEpoch((current) => current + 1);
  }, []);

  /*
   * Sledování adresy rámu.
   *
   * Jazyk se přepíná uvnitř rámu, ne v adrese pod dílnou - a přepínač je
   * `next/link`, takže jde o klientskou navigaci: dokument se nenačte znovu a
   * `onLoad` mlčí. Bez tohohle hlídání by panel u anglické stránky dál nabízel
   * české texty a napojení na text v rámu by zůstalo viset na staré stránce.
   *
   * Next o svých přechodech nedává vědět žádnou událostí, kterou by šlo
   * odsud odebírat, takže se adresa čte v krátkém intervalu. Je to jedno
   * čtení `location.pathname`, které se navíc dělá jen v editačním režimu.
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const path = framePathname(frame.current);
      if (!path || path === seenPath.current) return;

      seenPath.current = path;
      setLocale(localeFromPathname(path));
      // Stránka se přerovnala, takže napojení na text je potřeba udělat znovu.
      setFrameEpoch((current) => current + 1);
    }, PATH_POLL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.root} {...{ [PANEL_ATTRIBUTE]: "" }}>
      <iframe
        ref={frame}
        className={styles.frame}
        src={previewPath}
        title="Náhled webu"
        onLoad={handleFrameLoad}
      />
      {bridge ? (
        <EditPanel
          locale={locale}
          bridge={bridge}
          frameEpoch={frameEpoch}
          onSaved={reloadPreview}
          onExit={onExit}
          onSignedOut={onSignedOut}
        />
      ) : null}
    </div>
  );
}
