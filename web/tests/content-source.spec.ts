import { expect, test } from "@playwright/test";

import { usesFallbackOnly } from "@/lib/content/source";

test("bez project ID není koho se ptát", () => {
  expect(usesFallbackOnly({}, false)).toBe(true);
});

test("statický export čte jen z repa", () => {
  expect(usesFallbackOnly({ STATIC_EXPORT: "true" }, true)).toBe(true);
});

test("CONTENT_SOURCE=fallback odstřihne Sanity i s platnou konfigurací", () => {
  expect(usesFallbackOnly({ CONTENT_SOURCE: "fallback" }, true)).toBe(true);
});

test("s konfigurací a bez přepínačů se čte ze Sanity", () => {
  expect(usesFallbackOnly({}, true)).toBe(false);
});

test("CONTENT_SOURCE=sanity je výchozí chování napsané explicitně", () => {
  expect(usesFallbackOnly({ CONTENT_SOURCE: "sanity" }, true)).toBe(false);
});

test("prázdná hodnota se bere jako nenastaveno", () => {
  expect(usesFallbackOnly({ CONTENT_SOURCE: "" }, true)).toBe(false);
  expect(usesFallbackOnly({ STATIC_EXPORT: "" }, true)).toBe(false);
});

test("překlep v CONTENT_SOURCE spadne, ať se tiše nečte z živého CMS", () => {
  expect(() => usesFallbackOnly({ CONTENT_SOURCE: "falback" }, true)).toThrow(
    /CONTENT_SOURCE/,
  );
});

test("jen přesné \"true\" vypíná Sanity přes STATIC_EXPORT", () => {
  expect(usesFallbackOnly({ STATIC_EXPORT: "1" }, true)).toBe(false);
});
