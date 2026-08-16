import { expect, test } from "@playwright/test";

import { contentSource, usesFallbackOnly } from "@/lib/content/source";

test("bez nastavení se čte z repa", () => {
  // Zápis do svazku se zapíná vědomě, aby vývojářský stroj nesahal na cizí data.
  expect(contentSource({})).toBe("fallback");
  expect(usesFallbackOnly({})).toBe(true);
});

test("CONTENT_SOURCE=store zapne úložiště na disku", () => {
  expect(contentSource({ CONTENT_SOURCE: "store" })).toBe("store");
  expect(usesFallbackOnly({ CONTENT_SOURCE: "store" })).toBe(false);
});

test("statický export přebije i úložiště", () => {
  // Export běží při buildu, kde žádný svazek připojený není.
  expect(
    contentSource({ CONTENT_SOURCE: "store", STATIC_EXPORT: "true" }),
  ).toBe("fallback");
});

test("prázdná hodnota se bere jako nenastaveno", () => {
  expect(contentSource({ CONTENT_SOURCE: "" })).toBe("fallback");
  expect(contentSource({ CONTENT_SOURCE: "store", STATIC_EXPORT: "" })).toBe(
    "store",
  );
});

test("jen přesné \"true\" vypíná úložiště přes STATIC_EXPORT", () => {
  expect(contentSource({ CONTENT_SOURCE: "store", STATIC_EXPORT: "1" })).toBe(
    "store",
  );
});

test("překlep shodí build, ať se tiše nečte odjinud", () => {
  expect(() => contentSource({ CONTENT_SOURCE: "stroe" })).toThrow(
    /CONTENT_SOURCE/,
  );
  expect(() => contentSource({ CONTENT_SOURCE: "sanity" })).toThrow(
    /CONTENT_SOURCE/,
  );
});
