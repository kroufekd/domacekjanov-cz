/**
 * Rozměry a typ nahraného obrázku.
 *
 * Čte se z hlavičky souboru, ne z toho, co tvrdí prohlížeč - `Content-Type` z
 * formuláře si posílá klient a dá se přepsat. Zároveň to slouží jako kontrola
 * formátu: co se nepodaří přečíst, se nenahraje.
 *
 * Vlastní parser místo knihovny schválně. Potřebujeme tři formáty a pár desítek
 * řádků, ne další závislost v obrazu, kde se nativní moduly špatně sestavují.
 */

export type ImageFormat = "jpeg" | "png" | "webp";

export type ImageInfo = {
  readonly format: ImageFormat;
  readonly width: number;
  readonly height: number;
};

export const EXTENSIONS: Record<ImageFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

const startsWith = (data: Uint8Array, bytes: readonly number[]): boolean =>
  bytes.every((byte, index) => data[index] === byte);

/** PNG drží šířku a výšku v prvním chunku IHDR na pevných pozicích. */
function readPng(view: DataView): ImageInfo | null {
  if (view.byteLength < 24) return null;
  return {
    format: "png",
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

/**
 * JPEG se musí projít po segmentech: rozměry nesou až značky SOF, kterých je
 * několik druhů, a před nimi bývá EXIF náhled i barevný profil.
 */
function readJpeg(view: DataView): ImageInfo | null {
  let offset = 2;

  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;

    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);

    // SOF0-SOF15 nesou rozměry; DHT, DAC a RST mezi ně nepatří.
    const isFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isFrame) {
      return {
        format: "jpeg",
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }

    if (length < 2) return null;
    offset += 2 + length;
  }

  return null;
}

/** WebP má tři podoby kontejneru a každá píše rozměry jinam. */
function readWebp(view: DataView, data: Uint8Array): ImageInfo | null {
  if (view.byteLength < 30) return null;

  const kind = String.fromCharCode(...data.subarray(12, 16));

  if (kind === "VP8X") {
    return {
      format: "webp",
      width: 1 + (view.getUint32(24, true) & 0xffffff),
      height: 1 + ((view.getUint32(26, true) >> 8) & 0xffffff),
    };
  }

  if (kind === "VP8 ") {
    return {
      format: "webp",
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }

  if (kind === "VP8L") {
    const bits = view.getUint32(21, true);
    return {
      format: "webp",
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff),
    };
  }

  return null;
}

const isSane = (info: ImageInfo | null): info is ImageInfo =>
  info !== null &&
  Number.isInteger(info.width) &&
  Number.isInteger(info.height) &&
  info.width > 0 &&
  info.height > 0 &&
  info.width <= 20_000 &&
  info.height <= 20_000;

/** Vrátí typ a rozměry, nebo `null`, když to obrázek není. */
export function readImageInfo(data: Uint8Array): ImageInfo | null {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const info = startsWith(data, [0x89, 0x50, 0x4e, 0x47])
    ? readPng(view)
    : startsWith(data, [0xff, 0xd8, 0xff])
      ? readJpeg(view)
      : startsWith(data, [0x52, 0x49, 0x46, 0x46]) &&
          startsWith(data.subarray(8), [0x57, 0x45, 0x42, 0x50])
        ? readWebp(view, data)
        : null;

  return isSane(info) ? info : null;
}
