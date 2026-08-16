import { expect, test } from "@playwright/test";

import {
  isCategory,
  isUploaded,
  movePhoto,
  patchPhoto,
  uniqueId,
  type GalleryPhoto,
} from "@/lib/store/gallery";
import { readImageInfo } from "@/lib/store/image-size";
import { isSafeMediaName, slugify } from "@/lib/store/media";

const photo = (id: string, src = `/images/${id}.jpg`): GalleryPhoto => ({
  id,
  src,
  width: 100,
  height: 80,
});

test("název souboru se zbaví diakritiky, mezer i přípony", () => {
  expect(slugify("Nová Terasa Léto.JPG")).toBe("nova-terasa-leto");
  expect(slugify("  ---  ")).toBe("fotka");
  expect(slugify("řeřicha ǧ 42.png")).toBe("rericha-g-42");
});

test("ze svazku se vydá jen jméno, které sami zakládáme", () => {
  expect(isSafeMediaName("terasa-2.jpg")).toBe(true);
  expect(isSafeMediaName("../content.json")).toBe(false);
  expect(isSafeMediaName("/etc/passwd")).toBe(false);
  expect(isSafeMediaName("terasa.svg")).toBe(false);
  expect(isSafeMediaName("-skryta.jpg")).toBe(false);
});

test("rozměry se čtou z hlavičky, ne z toho, co tvrdí prohlížeč", () => {
  // Nejmenší platné PNG: signatura a IHDR se šířkou 2 a výškou 3.
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  new DataView(png.buffer).setUint32(16, 2);
  new DataView(png.buffer).setUint32(20, 3);

  expect(readImageInfo(png)).toEqual({ format: "png", width: 2, height: 3 });
});

test("co není obrázek, se nenahraje", () => {
  expect(readImageInfo(new TextEncoder().encode("tohle neni fotka"))).toBeNull();
  expect(readImageInfo(new Uint8Array(0))).toBeNull();
});

test("nahraná fotka dostane jedinečné id", () => {
  const photos = [photo("gallery-terasa")];
  expect(uniqueId(photos, "terasa")).toBe("gallery-terasa-2");
  expect(uniqueId(photos, "zahrada")).toBe("gallery-zahrada");
});

test("popisek se zapíše jen do zobrazeného jazyka", () => {
  const start: GalleryPhoto = {
    ...photo("gallery-terasa"),
    alt: { cs: "Terasa", de: "Terrasse", en: "Terrace" },
  };

  const next = patchPhoto(start, { alt: "Terasa s grilem" }, "cs");

  expect(next.alt).toEqual({
    cs: "Terasa s grilem",
    de: "Terrasse",
    en: "Terrace",
  });
});

test("posun mimo rozsah seznam nerozhodí", () => {
  const photos = [photo("a"), photo("b"), photo("c")];

  expect(movePhoto(photos, "a", -1).map((item) => item.id)).toEqual([
    "a",
    "b",
    "c",
  ]);
  expect(movePhoto(photos, "c", 1).map((item) => item.id)).toEqual([
    "a",
    "b",
    "c",
  ]);
  expect(movePhoto(photos, "b", -1).map((item) => item.id)).toEqual([
    "b",
    "a",
    "c",
  ]);
  expect(movePhoto(photos, "neznama", 1).map((item) => item.id)).toEqual([
    "a",
    "b",
    "c",
  ]);
});

test("posun nemění původní seznam", () => {
  const photos = [photo("a"), photo("b")];
  movePhoto(photos, "a", 1);
  expect(photos.map((item) => item.id)).toEqual(["a", "b"]);
});

test("fotka z nasazení se pozná podle adresy", () => {
  expect(isUploaded(photo("a", "/media/a.jpg"))).toBe(true);
  expect(isUploaded(photo("a", "/images/a.jpg"))).toBe(false);
});

test("kategorie je jen jedna ze tří", () => {
  expect(isCategory("pokoje")).toBe(true);
  expect(isCategory("kuchyne")).toBe(false);
  expect(isCategory(null)).toBe(false);
});
