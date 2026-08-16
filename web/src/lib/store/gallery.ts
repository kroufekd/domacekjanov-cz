import type { Locale } from "@/i18n/config";
import type { ContentStore } from "@/lib/store/content-store";
import { MEDIA_URL_PREFIX } from "@/lib/store/media";

/**
 * Fotky v galerii.
 *
 * Položka drží adresu, rozměry a překlady popisků. Pořadí je dané polem, ne
 * číslem `order` - to se dopočítává při zápisu, aby se nemohlo rozejít se
 * skutečným pořadím v seznamu.
 */

export const CATEGORIES = ["exterier", "spolecne", "pokoje"] as const;

export type GalleryCategory = (typeof CATEGORIES)[number];

export const isCategory = (value: unknown): value is GalleryCategory =>
  typeof value === "string" && CATEGORIES.includes(value as GalleryCategory);

export type GalleryPhoto = {
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt?: Record<string, string>;
  readonly caption?: Record<string, string>;
  readonly category?: GalleryCategory;
  readonly featured?: boolean;
  readonly order?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isPhoto = (value: unknown): value is GalleryPhoto =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.src === "string";

export const photosOf = (store: ContentStore): GalleryPhoto[] =>
  store.gallery.filter(isPhoto);

/** Pořadí drží seznam; `order` se jen dopisuje, ať sedí i po načtení. */
const renumber = (photos: readonly GalleryPhoto[]): GalleryPhoto[] =>
  photos.map((photo, index) => ({ ...photo, order: index }));

export const withPhotos = (
  store: ContentStore,
  photos: readonly GalleryPhoto[],
): ContentStore => ({ ...store, gallery: renumber(photos) });

/** Jedinečné id pro nově nahranou fotku. */
export function uniqueId(
  photos: readonly GalleryPhoto[],
  stem: string,
): string {
  const taken = new Set(photos.map((photo) => photo.id));
  const base = `gallery-${stem}`;

  if (!taken.has(base)) return base;

  const next = Array.from({ length: 500 }, (_, index) => `${base}-${index + 2}`);
  return next.find((candidate) => !taken.has(candidate)) ?? `${base}-${taken.size}`;
}

export type PhotoPatch = {
  readonly alt?: string;
  readonly caption?: string;
  readonly category?: GalleryCategory;
  readonly featured?: boolean;
};

/**
 * Promítne úpravu do jedné fotky. Popisky jsou přeložené, takže se zapisuje jen
 * do zobrazeného jazyka - stejně jako u textů.
 */
export function patchPhoto(
  photo: GalleryPhoto,
  patch: PhotoPatch,
  locale: Locale,
): GalleryPhoto {
  const text = (
    current: Record<string, string> | undefined,
    value: string | undefined,
  ): Record<string, string> | undefined => {
    if (value === undefined) return current;
    const next = { ...current, [locale]: value };
    return Object.values(next).some(Boolean) ? next : undefined;
  };

  return {
    ...photo,
    alt: text(photo.alt, patch.alt),
    caption: text(photo.caption, patch.caption),
    ...(patch.category === undefined ? {} : { category: patch.category }),
    ...(patch.featured === undefined ? {} : { featured: patch.featured }),
  };
}

/** Posune fotku o krok nahoru nebo dolů. Mimo rozsah se nic nestane. */
export function movePhoto(
  photos: readonly GalleryPhoto[],
  id: string,
  direction: -1 | 1,
): GalleryPhoto[] {
  const from = photos.findIndex((photo) => photo.id === id);
  const to = from + direction;

  if (from === -1 || to < 0 || to >= photos.length) return [...photos];

  const next = [...photos];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Fotka, kterou nese nasazení, se maže jen ze seznamu - soubor zůstává. */
export const isUploaded = (photo: GalleryPhoto): boolean =>
  photo.src.startsWith(MEDIA_URL_PREFIX);
