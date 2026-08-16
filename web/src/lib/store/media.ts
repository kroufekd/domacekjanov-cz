import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { EXTENSIONS, readImageInfo, type ImageInfo } from "@/lib/store/image-size";
import { mediaDir } from "@/lib/store/paths";

/**
 * Nahrané fotky na svazku.
 *
 * Původních 35 fotek zůstává v `web/public/images` a servíruje je Next jako
 * statické soubory. Sem přibývá jen to, co majitel nahraje z panelu - proto se
 * adresy liší: `/images/…` je součást nasazení, `/media/…` leží na svazku.
 */

/** Deset megabajtů pokryje i fotku z mobilu, ale ne nahrané video. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const MEDIA_URL_PREFIX = "/media/";

/**
 * Jméno souboru chodí z adresy, takže se z něj nesmí dát vylézt jinam. Pustíme
 * jen to, co sami zakládáme.
 */
const SAFE_NAME = /^[a-z0-9][a-z0-9-]{0,80}\.(jpg|png|webp)$/;

export const isSafeMediaName = (name: string): boolean => SAFE_NAME.test(name);

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const contentTypeFor = (name: string): string =>
  CONTENT_TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream";

/** Z názvu fotky udělá kus adresy: bez diakritiky, mezer a divných znaků. */
export function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base || "fotka";
}

export type StoredMedia = {
  readonly name: string;
  readonly url: string;
  readonly info: ImageInfo;
};

export type MediaOutcome =
  | { readonly media: StoredMedia }
  | { readonly error: string };

/**
 * Uloží nahraný soubor. Jméno vzniká ze zadaného názvu a doplní se o pořadové
 * číslo, když už takové existuje - přepsat cizí fotku by šlo jinak omylem.
 */
export async function storeUpload(
  data: Uint8Array,
  originalName: string,
  exists: (name: string) => boolean,
): Promise<MediaOutcome> {
  if (data.byteLength === 0) return { error: "Soubor je prázdný." };
  if (data.byteLength > MAX_UPLOAD_BYTES) {
    return {
      error: `Fotka je větší než ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
    };
  }

  const info = readImageInfo(data);
  if (!info) {
    return { error: "Tohle není fotka ve formátu JPEG, PNG ani WebP." };
  }

  const stem = slugify(originalName);
  const extension = EXTENSIONS[info.format];

  const name =
    [`${stem}.${extension}`, ...Array.from({ length: 500 }, (_, i) => `${stem}-${i + 2}.${extension}`)].find(
      (candidate) => !exists(candidate),
    ) ?? null;

  if (!name) return { error: "Fotku s tímhle názvem se nepovedlo pojmenovat." };

  const folder = mediaDir();
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, name), data);

  return { media: { name, url: `${MEDIA_URL_PREFIX}${name}`, info } };
}

/** Přečte fotku ze svazku. `null` znamená, že tam není. */
export async function readMedia(name: string): Promise<Buffer | null> {
  if (!isSafeMediaName(name)) return null;

  try {
    return await readFile(path.join(mediaDir(), name));
  } catch {
    return null;
  }
}

/**
 * Smaže soubor ze svazku. Fotky z `web/public/images` jsou součástí nasazení a
 * mažou se jen ze seznamu, soubor zůstává.
 */
export async function removeMedia(url: string): Promise<void> {
  if (!url.startsWith(MEDIA_URL_PREFIX)) return;

  const name = url.slice(MEDIA_URL_PREFIX.length);
  if (!isSafeMediaName(name)) return;

  await rm(path.join(mediaDir(), name), { force: true });
}
