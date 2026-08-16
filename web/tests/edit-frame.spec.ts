import { expect, test } from "@playwright/test";

import { fieldScope, splitParts } from "@/components/edit/frame-nodes";
import type { EditableField } from "@/lib/edit/fields";

const field = (path: string): EditableField => ({
  key: `siteCopy-main:${path}`,
  documentId: "siteCopy-main",
  path,
  localized: true,
  type: "line",
  label: path,
  value: "text",
});

test("titulek se svislítkem se hledá po částech", () => {
  expect(splitParts("Vířivý sud|a dětský domeček.")).toEqual([
    "Vířivý sud",
    "a dětský domeček.",
  ]);
});

test("text bez svislítka je jedna část", () => {
  expect(splitParts("  Zahrada a terasa  ")).toEqual(["Zahrada a terasa"]);
});

test("prázdné části mezi svislítky se zahazují", () => {
  expect(splitParts("Zahrada||terasa")).toEqual(["Zahrada", "terasa"]);
});

test("menu a patička se poznají podle cesty", () => {
  // Bez toho by se "Galerie" z menu napojila i na nadpis sekce Galerie.
  expect(fieldScope(field("nav.gallery"))).toBe("chrome");
  expect(fieldScope(field("footer.pricingLink"))).toBe("footer");
  expect(fieldScope(field("gallery.eyebrow"))).toBe("content");
  expect(fieldScope(field("actions.call"))).toBe("content");
});
