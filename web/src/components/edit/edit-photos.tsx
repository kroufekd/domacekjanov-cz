"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";

import styles from "./edit-mode.module.css";

/**
 * Správa fotek v galerii.
 *
 * Na rozdíl od textů se tady neschovává rozdělaná změna - nahrání, přesun i
 * smazání platí hned. Popisky se ukládají při opuštění pole, ať se nezapisuje
 * po každém písmenu.
 */

export type Photo = {
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly caption: string;
  readonly category: string;
  readonly featured: boolean;
  readonly uploaded: boolean;
};

type EditPhotosProps = {
  readonly locale: Locale;
  /** Po každé změně se rám načte znovu, ať je vidět výsledek. */
  readonly onChanged: () => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  exterier: "Exteriér",
  spolecne: "Společné prostory",
  pokoje: "Pokoje",
};

async function readError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  const message =
    typeof body === "object" && body !== null && "error" in body
      ? String((body as { error: unknown }).error)
      : "";
  return message || fallback;
}

type PhotoList = { readonly photos: Photo[]; readonly limitMb: number };

/** Načtení seznamu bez sahání na stav - o ten se stará volající. */
async function fetchPhotos(
  locale: Locale,
): Promise<PhotoList | { readonly error: string }> {
  try {
    const response = await fetch(`/api/edit/photos?locale=${locale}`, {
      cache: "no-store",
    });

    return response.ok
      ? ((await response.json()) as PhotoList)
      : { error: await readError(response, "Fotky se nepodařilo načíst.") };
  } catch {
    return { error: "Server neodpověděl." };
  }
}

export function EditPhotos({ locale, onChanged }: EditPhotosProps) {
  const [photos, setPhotos] = useState<readonly Photo[] | null>(null);
  const [limitMb, setLimitMb] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const result = await fetchPhotos(locale);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPhotos(result.photos);
    setLimitMb(result.limitMb);
  }, [locale]);

  useEffect(() => {
    let live = true;

    fetchPhotos(locale).then((result) => {
      if (!live) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPhotos(result.photos);
      setLimitMb(result.limitMb);
    });

    return () => {
      live = false;
    };
  }, [locale]);

  /** Každá operace končí stejně: znovu načíst seznam a překreslit náhled. */
  const run = useCallback(
    async (task: () => Promise<Response>, fallback: string) => {
      setBusy(true);
      setError(null);

      try {
        const response = await task();
        if (!response.ok) {
          setError(await readError(response, fallback));
          return;
        }
        await load();
        onChanged();
      } catch {
        setError("Server neodpověděl.");
      } finally {
        setBusy(false);
      }
    },
    [load, onChanged],
  );

  const upload = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      const data = new FormData();
      data.append("file", file);
      data.append("locale", locale);

      void run(
        () => fetch("/api/edit/photos", { method: "POST", body: data }),
        "Fotku se nepovedlo nahrát.",
      );
    },
    [locale, run],
  );

  const patch = useCallback(
    (id: string, change: Record<string, unknown>) =>
      run(
        () =>
          fetch("/api/edit/photos", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, locale, ...change }),
          }),
        "Změnu se nepovedlo uložit.",
      ),
    [locale, run],
  );

  /** Mazání na dvě kliknutí, stejně jako odchod z panelu s rozdělanou změnou. */
  const remove = useCallback(
    (photo: Photo) => {
      if (confirming !== photo.id) {
        setConfirming(photo.id);
        return;
      }

      setConfirming(null);
      void run(
        () =>
          fetch(`/api/edit/photos?id=${encodeURIComponent(photo.id)}`, {
            method: "DELETE",
          }),
        "Fotku se nepovedlo smazat.",
      );
    },
    [confirming, run],
  );

  if (!photos) {
    return <p className={styles.empty}>{error ?? "Načítám fotky…"}</p>;
  }

  return (
    <div>
      <div className={styles.photoTools}>
        <button
          type="button"
          className={styles.button}
          onClick={() => picker.current?.click()}
          disabled={busy}
        >
          {busy ? "Pracuji…" : "Nahrát fotku"}
        </button>
        <span className={styles.photoNote}>
          JPEG, PNG nebo WebP do {limitMb} MB. Přidá se na konec galerie.
        </span>
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            upload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className={styles.photoError}>{error}</p> : null}

      <ol className={styles.photoList}>
        {photos.map((photo, index) => (
          <li key={photo.id} className={styles.photo}>
            <div className={styles.photoHead}>
              {/* Náhled je malý a mění se po nahrání, optimalizace by nepomohla. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.photoThumb}
                src={photo.src}
                alt=""
                width={photo.width}
                height={photo.height}
              />
              <div className={styles.photoOrder}>
                <span className={styles.photoIndex}>{index + 1}.</span>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => patch(photo.id, { action: "move", direction: -1 })}
                  disabled={busy || index === 0}
                  aria-label="Posunout nahoru"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => patch(photo.id, { action: "move", direction: 1 })}
                  disabled={busy || index === photos.length - 1}
                  aria-label="Posunout dolů"
                >
                  ↓
                </button>
              </div>
            </div>

            <label className={styles.fieldLabel} htmlFor={`alt-${photo.id}`}>
              Popis pro vyhledávače a čtečky
            </label>
            <input
              id={`alt-${photo.id}`}
              className={styles.input}
              defaultValue={photo.alt}
              placeholder="Co je na fotce vidět"
              onBlur={(event) => {
                if (event.target.value.trim() !== photo.alt) {
                  void patch(photo.id, { alt: event.target.value });
                }
              }}
            />

            <label className={styles.fieldLabel} htmlFor={`caption-${photo.id}`}>
              Popisek v prohlížeči fotek
            </label>
            <input
              id={`caption-${photo.id}`}
              className={styles.input}
              defaultValue={photo.caption}
              placeholder="Nepovinné"
              onBlur={(event) => {
                if (event.target.value.trim() !== photo.caption) {
                  void patch(photo.id, { caption: event.target.value });
                }
              }}
            />

            <div className={styles.photoRow}>
              <select
                className={styles.select}
                value={photo.category}
                disabled={busy}
                aria-label="Kategorie"
                onChange={(event) =>
                  patch(photo.id, { category: event.target.value })
                }
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={photo.featured}
                  disabled={busy}
                  onChange={(event) =>
                    patch(photo.id, { featured: event.target.checked })
                  }
                />
                Velká
              </label>

              <button
                type="button"
                className={`${styles.button} ${
                  confirming === photo.id ? styles.buttonDanger : styles.buttonGhost
                }`}
                onClick={() => remove(photo)}
                onBlur={() => setConfirming(null)}
                disabled={busy}
              >
                {confirming === photo.id ? "Opravdu vyřadit?" : "Vyřadit"}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
