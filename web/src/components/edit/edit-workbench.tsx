"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";

import { EditPanel } from "./edit-panel";
import { createPreview, PANEL_ATTRIBUTE, type Preview } from "./preview";
import styles from "./edit-mode.module.css";

/**
 * Dílna: web v rámu vlevo, panel s texty vpravo.
 *
 * Rám je tu proto, že web dostane vlastní viewport. Panel položený přes
 * stránku by ji nejen zakrýval - hero, lepivá hlavička a šířky počítané z
 * `100vw` by pořád počítaly s celou obrazovkou a rozjely by se. Takhle web
 * neví, že vedle něj něco stojí, a vypadá přesně jako naostro.
 *
 * Rám je ze stejné domény, takže se do něj sahá přímo přes `contentDocument`.
 * Žádné posílání zpráv sem tam netřeba.
 */

type EditWorkbenchProps = {
  readonly locale: Locale;
  /** Adresa, kterou má rám ukázat - bez `?edit`, jinak by se zacyklil. */
  readonly previewPath: string;
  readonly onExit: () => void;
  readonly onSignedOut: () => void;
};

export function EditWorkbench({
  locale,
  previewPath,
  onExit,
  onSignedOut,
}: EditWorkbenchProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scrollToRestore = useRef<number | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  // Náhled vzniká až po prvním vykreslení, protože sahá na rám. Panel proto
  // naskočí o jedno vykreslení později, což není vidět - rám se stejně načítá.
  useEffect(() => {
    setPreview(createPreview(() => frame.current?.contentDocument ?? null));
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
    preview?.invalidate();

    const view = frame.current?.contentWindow;
    const offset = scrollToRestore.current;
    if (view && offset !== null) {
      view.scrollTo(0, offset);
      scrollToRestore.current = null;
    }
  }, [preview]);

  return (
    <div className={styles.root} {...{ [PANEL_ATTRIBUTE]: "" }}>
      <iframe
        ref={frame}
        className={styles.frame}
        src={previewPath}
        title="Náhled webu"
        onLoad={handleFrameLoad}
      />
      {preview ? (
        <EditPanel
          locale={locale}
          preview={preview}
          onSaved={reloadPreview}
          onExit={onExit}
          onSignedOut={onSignedOut}
        />
      ) : null}
    </div>
  );
}
